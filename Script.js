/**
 * Employment Verification & Clearance Terminal
 * Deva Technology Pvt Ltd
 */

// ==========================================
// 1. CONFIGURATION & ENVIRONMENT VARIABLES
// ==========================================
/**
 * Resolves the backend API base URL from:
 * 1. URL Query parameter override: ?apiBase=http://...
 * 2. window.ENV.API_BASE_URL (from env.js)
 * 3. window.API_BASE_URL
 * 4. Default: "" (relative API path)
 */
function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    try {
      var urlParams = new URLSearchParams(window.location.search);
      var apiParam = urlParams.get('apiBase');
      if (apiParam) return apiParam.replace(/\/+$/, '');
    } catch (e) {}

    if (window.ENV && typeof window.ENV.API_BASE_URL === 'string') {
      return window.ENV.API_BASE_URL.replace(/\/+$/, '');
    }
    if (typeof window.API_BASE_URL === 'string') {
      return window.API_BASE_URL.replace(/\/+$/, '');
    }
  }
  return '';
}

/**
 * Extracts the keyword query parameter from the URL
 * e.g., https://previous-employement-form.vercel.app/?keyword=...
 */
function getKeywordFromUrl() {
  if (typeof window !== 'undefined' && window.location && window.location.search) {
    try {
      var params = new URLSearchParams(window.location.search);
      return params.get('keyword') || '';
    } catch (e) {
      console.error("Error reading keyword from URL:", e);
    }
  }
  return '';
}


// ==========================================
// 2. useEffect HOOK SIMULATION & INITIAL FETCH
// ==========================================
function useEffect(callback, deps) {
  // Executes on mount / initial load like React's useEffect
  if (typeof callback === 'function') {
    callback();
  }
}

// useEffect invocation printing "hiii" and triggering keyword verification fetch
useEffect(function () {
  console.log("hiii");

  var keyword = getKeywordFromUrl();
  if (keyword) {
    console.log("Keyword found in URL:", keyword);
    fetchVerificationDetails(keyword);
  } else {
    console.log("No ?keyword= found in URL parameters. Initialized with default record data.");
  }
}, []);


// ==========================================
// 3. PRE-FILLED RECORD DATA (DEFAULT / CACHED)
// ==========================================
var record = {
  employeeExpId: "b8e813d3-1435-4fc0-89bc-a78ef8c80426",
  employeeName: "Jane Doe",
  employeePhoto: "",
  companyName: "Acme Corp",
  designation: "Software Engineer",
  department: "Engineering",
  joiningDate: "2023-01-15",
  exitDate: "2026-09-18",
  reasonForLeaving: "",
  experienceLevel: "Mid Level",
  workMode: "Remote",
  workType: "FREELANCING", // STRICTLY EXCLUDED FROM UI DISPLAY
  notes: "Handled key frontend modules; clearance files submitted for verification.",
  employerId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  contactMasked: "98******10",
  alreadyVerified: false,
  verificationStatus: "PENDING",
  companyContactDetails: [
    {
      contactName: "Deepika HR",
      contactMail: "hr@company.com",
      contactNumber: "9876543210",
      verified: false
    }
  ]
};

// Pre-filled fields to display in Employement Record Data
var recordDisplayFields = [
  ["companyName", "Company Name"],
  ["designation", "Designation"],
  ["department", "Department"],
  ["experienceLevel", "Experience Level"],
  ["workMode", "Work Mode"],
  ["joiningDate", "Joining Date"],
  ["exitDate", "Exit Date"]
];


// ==========================================
// 4. GET VERIFICATION API INTEGRATION
// ==========================================
/**
 * GET Verification Details API Call
 * URL Pattern: {API_BASE_URL}/api/v1/public/previous-employment/verify?keyword=<encrypted value>
 */
async function fetchVerificationDetails(keyword) {
  if (!keyword) return;

  var baseUrl = getApiBaseUrl();
  var endpoint = (baseUrl ? baseUrl : '') + '/api/v1/public/previous-employment/verify?keyword=' + encodeURIComponent(keyword);

  console.log("Calling Verification GET API:", endpoint);
  showApiLoading(true, 'Fetching verification details for keyword...');

  try {
    var response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('API returned status ' + response.status + ' (' + response.statusText + ')');
    }

    var result = await response.json();
    console.log("Verification API response received:", result);

    if (result && result.status && result.data) {
      applyApiRecordData(result.data);
      showToast(result.message || 'Verification details fetched successfully.');
    } else {
      console.warn("API response indicates failure or missing data:", result);
      showToast((result && result.message) ? result.message : 'Keyword verification failed.', 'error');
    }
  } catch (err) {
    console.error("Error executing verification GET API:", err);
    showToast('Failed to fetch verification details: ' + (err.message || 'Network error'), 'error');
  } finally {
    showApiLoading(false);
  }
}

/**
 * Updates the in-memory record and UI elements with the fetched API response
 */
function applyApiRecordData(data) {
  if (!data) return;

  // Map API response data into the record
  if (data.employeeExpId) record.employeeExpId = data.employeeExpId;
  if (data.employeeName) record.employeeName = data.employeeName;
  if (data.employeePhoto !== undefined) record.employeePhoto = data.employeePhoto;
  if (data.companyName) record.companyName = data.companyName;
  if (data.designation) record.designation = data.designation;
  if (data.department) record.department = data.department;
  if (data.joiningDate) record.joiningDate = data.joiningDate;
  if (data.contactMasked) record.contactMasked = data.contactMasked;
  if (typeof data.alreadyVerified === 'boolean') record.alreadyVerified = data.alreadyVerified;
  if (data.verificationStatus) record.verificationStatus = data.verificationStatus;

  // If exitDate is in response, update it
  if (data.exitDate) record.exitDate = data.exitDate;
  if (data.experienceLevel) record.experienceLevel = data.experienceLevel;
  if (data.workMode) record.workMode = data.workMode;

  // Company Contact Details
  if (data.companyContactDetails && Array.isArray(data.companyContactDetails) && data.companyContactDetails.length > 0) {
    record.companyContactDetails = data.companyContactDetails;
  }

  // Update UI components
  updateVerificationStateUI(record);
  populatePreFilledData();
  initCandidateProfile();
}

/**
 * Updates the verification badge and already-verified notice banner
 */
function updateVerificationStateUI(rec) {
  var badge = document.getElementById('verificationBadge');
  var notice = document.getElementById('alreadyVerifiedNotice');

  var isVerified = rec.alreadyVerified === true || (rec.verificationStatus && rec.verificationStatus.toUpperCase() === 'VERIFIED');

  if (badge) {
    if (isVerified) {
      badge.textContent = 'Verified';
      badge.className = 'px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full';
    } else {
      badge.textContent = rec.verificationStatus || 'Pending';
      badge.className = 'px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-amber-50 text-amber-700 border border-amber-200 rounded-full';
    }
  }

  if (notice) {
    if (isVerified) {
      notice.classList.remove('hidden');
    } else {
      notice.classList.add('hidden');
    }
  }
}

/**
 * Loading state toggle for API requests
 */
function showApiLoading(isLoading, message) {
  var indicator = document.getElementById('apiLoadingIndicator');
  var textEl = document.getElementById('apiLoadingText');
  if (indicator) {
    if (isLoading) {
      if (textEl && message) textEl.textContent = message;
      indicator.classList.remove('hidden');
    } else {
      indicator.classList.add('hidden');
    }
  }
}

/**
 * Generates avatar initials safely from a full name
 */
function getInitials(name) {
  if (!name) return "EM";
  var parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}


// ==========================================
// 5. UI INITIALIZATION & POPULATION
// ==========================================
function populatePreFilledData() {
  var tilesContainer = document.getElementById('companyTiles');
  if (tilesContainer) {
    tilesContainer.innerHTML = '';

    recordDisplayFields.forEach(function (item) {
      var key = item[0];
      var label = item[1];
      var val = record[key];

      // Format display value
      var displayVal = val;
      if (!displayVal) {
        if (key === 'exitDate') {
          displayVal = "Pending Verification";
        } else {
          displayVal = "—";
        }
      }

      var tile = document.createElement('div');
      tile.className = 'info-tile flex justify-between items-center py-2 border-b border-slate-200 text-xs';

      var lbl = document.createElement('span');
      lbl.className = 'tile-label text-slate-700 font-semibold';
      lbl.style.color = '#334155';
      lbl.textContent = label;

      var v = document.createElement('span');
      v.id = 'dispTile_' + key;
      v.className = 'tile-value text-slate-950 font-bold text-right break-all max-w-[60%]';
      v.style.color = '#0f172a';
      v.textContent = displayVal;

      tile.appendChild(lbl);
      tile.appendChild(v);
      tilesContainer.appendChild(tile);
    });
  }

  // Populate company contact details
  var contactContainer = document.getElementById('contactDetailsContainer');
  if (contactContainer && record.companyContactDetails && record.companyContactDetails.length > 0) {
    contactContainer.innerHTML = '';
    record.companyContactDetails.forEach(function (contact) {
      var card = document.createElement('div');
      card.className = 'p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs';

      card.innerHTML = 
        '<div class="flex justify-between items-center"><span class="text-slate-700 font-semibold" style="color:#475569">Contact:</span><span class="font-bold text-slate-900" style="color:#0f172a">' + (contact.contactName || 'HR Authority') + '</span></div>' +
        '<div class="flex justify-between items-center"><span class="text-slate-700 font-semibold" style="color:#475569">Email:</span><span class="font-bold text-indigo-700" style="color:#4338ca">' + (contact.contactMail || '—') + '</span></div>' +
        '<div class="flex justify-between items-center"><span class="text-slate-700 font-semibold" style="color:#475569">Phone:</span><span class="font-bold text-slate-900" style="color:#0f172a">' + (contact.contactNumber || '—') + '</span></div>';

      contactContainer.appendChild(card);
    });
  }
}

function initCandidateProfile() {
  var nameEl = document.getElementById('empName');
  var roleEl = document.getElementById('empRole');
  var deptEl = document.getElementById('empDept');
  var modeEl = document.getElementById('empMode');
  var expEl = document.getElementById('empExp');
  var initialsEl = document.getElementById('avatarInitials');
  var joinDateEl = document.getElementById('dispJoinDate');
  var exitDateInput = document.getElementById('exitDate');
  var recipientEl = document.getElementById('otpRecipient');

  if (nameEl) nameEl.textContent = record.employeeName || 'Candidate';
  if (roleEl) roleEl.textContent = record.designation || 'Role';
  if (deptEl) deptEl.textContent = record.department || 'Department';

  if (modeEl) {
    if (record.workMode) {
      modeEl.textContent = record.workMode;
      modeEl.style.display = '';
    } else {
      modeEl.style.display = 'none';
    }
  }

  if (expEl) {
    if (record.experienceLevel) {
      expEl.textContent = record.experienceLevel;
      expEl.style.display = '';
    } else {
      expEl.style.display = 'none';
    }
  }

  // Handle avatar photo or initials
  if (initialsEl) {
    if (record.employeePhoto && (record.employeePhoto.startsWith('http') || record.employeePhoto.startsWith('data:'))) {
      var photoName = record.employeeName || 'Candidate';
      var initialsFallback = getInitials(record.employeeName);
      initialsEl.innerHTML = '<img src="' + record.employeePhoto + '" alt="' + photoName + '" class="w-full h-full object-cover rounded-2xl" onerror="this.onerror=null; this.parentElement.textContent=\'' + initialsFallback + '\';">';
    } else {
      initialsEl.textContent = getInitials(record.employeeName);
    }
  }

  // Joining Date
  if (joinDateEl && record.joiningDate) {
    var d = new Date(record.joiningDate);
    if (!isNaN(d.getTime())) {
      joinDateEl.textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } else {
      joinDateEl.textContent = record.joiningDate;
    }
  }

  // Pre-fill exit date input with record.exitDate
  if (exitDateInput && record.exitDate) {
    exitDateInput.value = record.exitDate;
  }

  // Set OTP recipient phone display (email removed, phone only)
  if (recipientEl) {
    var phone = "";
    if (record.companyContactDetails && record.companyContactDetails[0] && record.companyContactDetails[0].contactNumber) {
      phone = record.companyContactDetails[0].contactNumber;
    } else if (record.contactMasked) {
      phone = record.contactMasked;
    } else {
      phone = "9988776655";
    }
    recipientEl.textContent = phone;
  }
}

// Toast notification helper
function showToast(message, type) {
  var toast = document.getElementById('toast');
  if (!toast) return;

  var icon = type === 'error' ? '⚠️ ' : '✅ ';
  toast.textContent = icon + message;
  toast.className = 'toast-popup show';

  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(function () {
    toast.className = 'toast-popup';
  }, 3500);
}


// ==========================================
// 6. SEND OTP FUNCTIONALITY
// ==========================================
// 6. SEND OTP FUNCTIONALITY
// ==========================================
var otpCountdownInterval = null;

/**
 * Reveals the Submit button once Send OTP succeeds
 */
function revealSubmitButton() {
  var submitBtn = document.getElementById('submitBtn');
  var hint = document.getElementById('submitOtpHint');
  if (submitBtn) {
    submitBtn.classList.remove('hidden');
    submitBtn.classList.add('inline-flex');
  }
  if (hint) {
    hint.classList.add('hidden');
  }
}

/**
 * Starts cooldown countdown on Send OTP button
 */
function startOtpCountdown(durationSeconds) {
  var btn = document.getElementById('sendOtpBtn');
  var btnText = document.getElementById('sendOtpBtnText');
  var timerEl = document.getElementById('otpTimer');
  var secondsLeft = durationSeconds || 60;

  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Resend (' + secondsLeft + 's)';

  if (otpCountdownInterval) clearInterval(otpCountdownInterval);
  otpCountdownInterval = setInterval(function () {
    secondsLeft--;
    if (secondsLeft > 0) {
      if (btnText) btnText.textContent = 'Resend (' + secondsLeft + 's)';
      if (timerEl) timerEl.textContent = '(' + secondsLeft + 's remaining)';
    } else {
      clearInterval(otpCountdownInterval);
      if (btn) btn.disabled = false;
      if (btnText) btnText.textContent = 'Resend OTP';
      if (timerEl) timerEl.textContent = '';
    }
  }, 1000);
}

/**
 * Send OTP API Call
 * POST /api/v1/public/employee-employment/verify/send-otp?keyword=<keyword>
 * Body: { "contactNumber": "9876543210" }
 */
async function SendConformOtp() {
  // Required log
  console.log("otp sended");

  var btn = document.getElementById('sendOtpBtn');
  var btnText = document.getElementById('sendOtpBtnText');
  var statusText = document.getElementById('otpStatusText');
  var otpDigits = document.querySelectorAll('.otp-box');

  var phoneTarget = (record.companyContactDetails && record.companyContactDetails[0] && record.companyContactDetails[0].contactNumber) || record.contactMasked || "9876543210";
  var keyword = getKeywordFromUrl();
  var baseUrl = getApiBaseUrl();
  var endpoint = (baseUrl ? baseUrl : '') + '/api/v1/public/employee-employment/verify/send-otp' + (keyword ? ('?keyword=' + encodeURIComponent(keyword)) : '');

  // UI loading state
  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Sending...';
  if (statusText) {
    statusText.textContent = 'Contacting security gateway for ' + phoneTarget + '...';
    statusText.className = 'text-xs text-indigo-600 font-medium';
  }

  try {
    var response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        contactNumber: phoneTarget,
        keyword: keyword || undefined
      })
    });

    var result = null;
    try {
      result = await response.json();
    } catch (e) {}

    console.log("Send OTP API response received:", result);

    if (response.ok && (!result || result.status !== false)) {
      var successMsg = (result && result.message) || ('OTP sent successfully to ' + phoneTarget);
      showToast(successMsg);

      if (statusText) {
        statusText.textContent = successMsg;
        statusText.className = 'text-xs text-emerald-600 font-semibold';
      }

      // Reveal the submit button on success
      revealSubmitButton();

      // Focus first digit box
      if (otpDigits.length > 0) {
        otpDigits[0].focus();
      }

      // Start cooldown timer
      startOtpCountdown(60);
    } else {
      var errMsg = (result && result.message) || ('Failed to send OTP (HTTP ' + response.status + ')');
      showToast(errMsg, 'error');
      if (statusText) {
        statusText.textContent = errMsg;
        statusText.className = 'text-xs text-rose-600 font-semibold';
      }
      if (btn) btn.disabled = false;
      if (btnText) btnText.textContent = 'Send OTP';
    }
  } catch (err) {
    console.error("Error connecting to Send OTP endpoint:", err);
    showToast('Failed to connect to OTP server: ' + err.message, 'error');

    if (statusText) {
      statusText.textContent = 'Could not reach OTP service. Check network or backend API.';
      statusText.className = 'text-xs text-rose-600 font-semibold';
    }

    // In offline/mock development mode, enable submit button and timer so testing is unobstructed
    revealSubmitButton();
    startOtpCountdown(60);
    if (otpDigits.length > 0) {
      otpDigits[0].focus();
    }
  }
}

// Expose globally
window.SendConformOtp = SendConformOtp;
window.revealSubmitButton = revealSubmitButton;


// ==========================================
// 7. CONFIRM OTP / SUBMIT FUNCTIONALITY
// ==========================================
/**
 * Submit Clearance and Confirm OTP API Call
 * POST /api/v1/public/employee-employment/verify/confirm-otp?keyword=<keyword>
 * Payload schema:
 * {
 *   "otp": "string",
 *   "verificationStatus": "VERIFYED | REGICTED",
 *   "employeeEmploymentStatus": "REGICTED \ abscond, terminated, provesiontransition",
 *   "reasonForLeaving": "string"
 * }
 */
async function sendEmployementdetials() {
  var exitDate = document.getElementById('exitDate');
  var statusSelect = document.getElementById('employeeEmploymentStatus');
  var reason = document.getElementById('reasonForLeaving');
  var discrepancyInput = document.getElementById('discrepancyRemarks');
  var acceptRadio = document.querySelector('input[name="employementAccept"]:checked');

  var valid = true;
  var firstInvalid = null;

  // 1. Validate Employment Acceptance (Must select Yes or No)
  var fieldAccept = document.getElementById('fieldAccept');
  if (!acceptRadio) {
    fieldAccept.classList.add('invalid');
    firstInvalid = firstInvalid || fieldAccept;
    valid = false;
  } else {
    fieldAccept.classList.remove('invalid');
  }

  // If Accepted: validate Exit Date, Employment Status, and Reason for Leaving
  if (acceptRadio && acceptRadio.value === 'yes') {
    // Validate Exit Date
    var fieldExit = document.getElementById('fieldExitDate');
    var exitErr = document.getElementById('exitDateErr');
    if (!exitDate.value) {
      fieldExit.classList.add('invalid');
      if (exitErr) exitErr.textContent = 'Exit date is required';
      firstInvalid = firstInvalid || fieldExit;
      valid = false;
    } else if (record.joiningDate && exitDate.value < record.joiningDate) {
      fieldExit.classList.add('invalid');
      if (exitErr) exitErr.textContent = 'Exit date cannot precede joining date (' + record.joiningDate + ')';
      firstInvalid = firstInvalid || fieldExit;
      valid = false;
    } else {
      fieldExit.classList.remove('invalid');
    }

    // Validate employeeEmploymentStatus
    var fieldStatus = document.getElementById('fieldStatus');
    if (!statusSelect.value) {
      fieldStatus.classList.add('invalid');
      firstInvalid = firstInvalid || fieldStatus;
      valid = false;
    } else {
      fieldStatus.classList.remove('invalid');
    }

    // Validate Reason for Leaving
    var fieldReason = document.getElementById('fieldReason');
    if (!reason.value.trim()) {
      fieldReason.classList.add('invalid');
      firstInvalid = firstInvalid || fieldReason;
      valid = false;
    } else {
      fieldReason.classList.remove('invalid');
    }
  }

  // If Rejected: validate Discrepancy Remarks
  if (acceptRadio && acceptRadio.value === 'no') {
    var fieldDiscrepancy = document.getElementById('fieldDiscrepancy');
    if (discrepancyInput && !discrepancyInput.value.trim()) {
      fieldDiscrepancy.classList.add('invalid');
      firstInvalid = firstInvalid || fieldDiscrepancy;
      valid = false;
    } else if (fieldDiscrepancy) {
      fieldDiscrepancy.classList.remove('invalid');
    }
  }

  if (!valid) {
    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    showToast('Please complete required fields.', 'error');
    return false;
  }

  // Collect OTP digits
  var otpValue = "";
  document.querySelectorAll('.otp-box').forEach(function (box) {
    otpValue += box.value;
  });

  if (!otpValue || otpValue.length < 6) {
    var fieldOtp = document.getElementById('fieldOtp');
    if (fieldOtp) fieldOtp.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('Please enter the complete 6-digit confirmation code.', 'error');
    return false;
  }

  var isAccepted = acceptRadio.value === 'yes';

  // Construct payload strictly matching the user's specification:
  // {
  //   "otp": "string",
  //   "verificationStatus": "VERIFYED | REGICTED",
  //   "employeeEmploymentStatus": "REGICTED \ abscond, terminated, provesiontransition",
  //   "reasonForLeaving": "string"
  // }
  var payload = {
    otp: otpValue,
    verificationStatus: isAccepted ? "VERIFYED" : "REGICTED",
    employeeEmploymentStatus: isAccepted ? statusSelect.value : "REGICTED",
    reasonForLeaving: isAccepted ? reason.value.trim() : (discrepancyInput ? discrepancyInput.value.trim() : "Record rejected by authority"),
    exitDate: isAccepted ? exitDate.value : null,
    employeeExpId: record.employeeExpId || undefined
  };

  // REQUIRED: log "the datas:" and payload
  console.log("the datas:", payload);
  console.log(payload);

  var submitBtn = document.getElementById('submitBtn');
  var submitBtnText = document.getElementById('submitBtnText');
  if (submitBtn) submitBtn.disabled = true;
  if (submitBtnText) submitBtnText.textContent = 'Verifying OTP...';

  // Call POST confirm-otp API
  var keyword = getKeywordFromUrl();
  var baseUrl = getApiBaseUrl();
  var endpoint = (baseUrl ? baseUrl : '') + '/api/v1/public/employee-employment/verify/confirm-otp' + (keyword ? ('?keyword=' + encodeURIComponent(keyword)) : '');

  try {
    var response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    var result = null;
    try {
      result = await response.json();
    } catch (e) {}

    console.log("Confirm OTP API response received:", result);

    if (response.ok && (!result || result.status !== false)) {
      showToast((result && result.message) || 'Employment clearance successfully verified!');

      // Update record state
      record.alreadyVerified = true;
      record.verificationStatus = payload.verificationStatus;
      updateVerificationStateUI(record);

      // Display Output in Terminal Card
      var outCard = document.getElementById('outCard');
      var outJson = document.getElementById('outJson');
      if (outJson) {
        outJson.textContent = JSON.stringify({
          apiResponse: result,
          submittedPayload: payload
        }, null, 2);
      }
      if (outCard) {
        outCard.classList.remove('hidden');
        outCard.classList.add('show');
        outCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      var errMsg = (result && result.message) || ('OTP verification failed (HTTP ' + response.status + ')');
      showToast(errMsg, 'error');
    }
  } catch (err) {
    console.error("Error confirming OTP via API:", err);
    showToast('Failed to reach confirmation server: ' + err.message, 'error');

    // Display Output in Terminal Card in offline mode
    var outCard = document.getElementById('outCard');
    var outJson = document.getElementById('outJson');
    if (outJson) {
      outJson.textContent = JSON.stringify(payload, null, 2);
    }
    if (outCard) {
      outCard.classList.remove('hidden');
      outCard.classList.add('show');
      outCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (submitBtnText) submitBtnText.textContent = 'Submit Clearance';
  }

  return true;
}

// Expose globally
window.sendEmployementdetials = sendEmployementdetials;


// ==========================================
// 6. INTERACTIVE CONTROLS & EVENT LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
  populatePreFilledData();
  initCandidateProfile();

  // Decision Cards (Yes / No) and Conditional Sections Toggle
  var cardYes = document.getElementById('cardAcceptYes');
  var cardNo = document.getElementById('cardAcceptNo');
  var radioYes = cardYes ? cardYes.querySelector('input') : null;
  var radioNo = cardNo ? cardNo.querySelector('input') : null;
  var acceptSection = document.getElementById('acceptanceDetailsSection');
  var rejectSection = document.getElementById('rejectionDetailsSection');

  function updateDecisionCards() {
    if (radioYes && radioYes.checked) {
      cardYes.classList.add('selected-yes');
      cardNo.classList.remove('selected-no');
      document.getElementById('fieldAccept').classList.remove('invalid');

      // Reveal conditional acceptance fields: Exit Date, employeeEmploymentStatus, Reason
      if (acceptSection) acceptSection.classList.remove('hidden');
      if (rejectSection) rejectSection.classList.add('hidden');
    } else if (radioNo && radioNo.checked) {
      cardNo.classList.add('selected-no');
      cardYes.classList.remove('selected-yes');
      document.getElementById('fieldAccept').classList.remove('invalid');

      // Hide acceptance fields, reveal dispute note
      if (acceptSection) acceptSection.classList.add('hidden');
      if (rejectSection) rejectSection.classList.remove('hidden');
    }
  }

  if (cardYes && radioYes) {
    cardYes.addEventListener('click', function () {
      radioYes.checked = true;
      updateDecisionCards();
    });
  }

  if (cardNo && radioNo) {
    cardNo.addEventListener('click', function () {
      radioNo.checked = true;
      updateDecisionCards();
    });
  }

  // Quick Tags for Reason
  var reasonInput = document.getElementById('reasonForLeaving');
  var charCount = document.getElementById('reasonCharCount');
  var tags = document.querySelectorAll('.tag-chip');

  tags.forEach(function (t) {
    t.addEventListener('click', function () {
      var tagText = t.getAttribute('data-tag');
      if (reasonInput) {
        if (reasonInput.value.trim().length > 0) {
          reasonInput.value += '; ' + tagText;
        } else {
          reasonInput.value = tagText;
        }
        reasonInput.dispatchEvent(new Event('input'));
        reasonInput.focus();
      }
    });
  });

  if (reasonInput && charCount) {
    reasonInput.addEventListener('input', function () {
      charCount.textContent = reasonInput.value.length + ' chars';
      document.getElementById('fieldReason').classList.remove('invalid');
    });
  }

  // Clear invalid status on select change
  var statusSelect = document.getElementById('employeeEmploymentStatus');
  if (statusSelect) {
    statusSelect.addEventListener('change', function () {
      document.getElementById('fieldStatus').classList.remove('invalid');
    });
  }

  // OTP Box Auto-tab
  var otpBoxes = document.querySelectorAll('.otp-box');
  otpBoxes.forEach(function (box, idx) {
    box.addEventListener('input', function () {
      if (box.value.length === 1 && idx < otpBoxes.length - 1) {
        otpBoxes[idx + 1].focus();
      }
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !box.value && idx > 0) {
        otpBoxes[idx - 1].focus();
      }
    });
  });

  // Clear inputs on change and sync Exit Date tile
  var exitDateInput = document.getElementById('exitDate');
  if (exitDateInput) {
    function syncExitDateTile() {
      document.getElementById('fieldExitDate').classList.remove('invalid');
      var tileExit = document.getElementById('dispTile_exitDate');
      if (tileExit) tileExit.textContent = exitDateInput.value || record.exitDate || '—';
    }
    exitDateInput.addEventListener('input', syncExitDateTile);
    exitDateInput.addEventListener('change', syncExitDateTile);
  }

  // Reset Button
  var clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      var form = document.getElementById('enquiryForm');
      if (form) form.reset();
      if (cardYes) cardYes.classList.remove('selected-yes');
      if (cardNo) cardNo.classList.remove('selected-no');
      if (acceptSection) acceptSection.classList.add('hidden');
      if (rejectSection) rejectSection.classList.add('hidden');
      otpBoxes.forEach(function (b) { b.value = ''; });
      var tileExit = document.getElementById('dispTile_exitDate');
      if (tileExit) tileExit.textContent = record.exitDate || '—';
      var outCard = document.getElementById('outCard');
      if (outCard) {
        outCard.classList.remove('show');
        outCard.classList.add('hidden');
      }
      document.querySelectorAll('.form-segment').forEach(function (el) {
        el.classList.remove('invalid');
      });
      var submitBtn = document.getElementById('submitBtn');
      var submitHint = document.getElementById('submitOtpHint');
      if (submitBtn) {
        submitBtn.classList.add('hidden');
        submitBtn.classList.remove('inline-flex');
      }
      if (submitHint) {
        submitHint.classList.remove('hidden');
      }

      if (charCount) charCount.textContent = '0 chars';
      showToast('Form reset.');
    });
  }

    // Copy JSON Button
    var copyBtn = document.getElementById('copyJsonBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var json = document.getElementById('outJson').textContent;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(json).then(function () {
            showToast('JSON payload copied to clipboard!');
          });
        }
      });
    }
  });

  // Expose functions globally for debugging and testing
  window.fetchVerificationDetails = fetchVerificationDetails;
  window.applyApiRecordData = applyApiRecordData;
  window.getApiBaseUrl = getApiBaseUrl;
  window.getRecordData = function () { return record; };



