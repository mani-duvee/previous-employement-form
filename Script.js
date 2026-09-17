(function(){
  // ---- pre-filled record ----
  var record = {
    companyName: "Deva Technology Pvt Ltd",
    city: "Coimbatore",
    companyEmail: "hr@devatech.com",
    businessCategory: "IT Services",
    businessType: "Private Limited",
    phoneNumber: "9988776655",
    email: "info@devatech.com",
    employeeName: "Manikandan S",
    designation: "Frontend Developer",
    department: "Development",
    experienceLevel: "Mid",
    workMode: "Remote",
    joiningDate: "2026-09-16",
    exitDate: null,
    reasonForLeaving: null,
    rating: null,
    employementAccept: null
  };

  var companyFields = [
    ["companyName","Company Name"],["businessCategory","Business Category"],
    ["businessType","Business Type"],["city","City"],
    ["companyEmail","Company Email"],["email","Email"],["phoneNumber","Phone Number"]
  ];
  var employmentFields = [
    ["employeeName","Employee Name"],["designation","Designation"],
    ["department","Department"],["experienceLevel","Experience Level"],
    ["workMode","Work Mode"],["joiningDate","Joining Date"]
  ];

  function fill(gridId, fields){
    var g = document.getElementById(gridId);
    fields.forEach(function(f){
      var d = document.createElement('div');
      d.className = 'ro';
      var l = document.createElement('label'); l.textContent = f[1];
      var v = document.createElement('div'); v.className = 'val';
      v.textContent = (record[f[0]] === null || record[f[0]] === "") ? '—' : record[f[0]];
      d.appendChild(l); d.appendChild(v); g.appendChild(d);
    });
  }
  fill('companyGrid', companyFields);
  fill('employmentGrid', employmentFields);

  document.getElementById('formTitle').textContent = 'Enquiry Form for ' + record.companyName;
  document.title = 'Enquiry Form for ' + record.companyName;

  // ---- rating ----
  var rating = null;
  var starBtns = Array.prototype.slice.call(document.querySelectorAll('#stars button'));
  var ratingLbl = document.getElementById('ratingLbl');
  var words = {1:'Poor',2:'Fair',3:'Good',4:'Very good',5:'Excellent'};
  starBtns.forEach(function(b){
    b.addEventListener('click', function(){
      rating = parseInt(b.dataset.v, 10);
      starBtns.forEach(function(x){ x.classList.toggle('on', parseInt(x.dataset.v,10) <= rating); });
      ratingLbl.textContent = rating + '/5 · ' + words[rating];
      b.closest('[data-field]').classList.remove('invalid');
    });
  });

  var form = document.getElementById('enquiryForm');
  var exitDate = document.getElementById('exitDate');
  var reason = document.getElementById('reasonForLeaving');

  form.addEventListener('input', function(e){
    var c = e.target.closest('[data-field]');
    if (c) c.classList.remove('invalid');
  });
  form.addEventListener('change', function(e){
    var c = e.target.closest('[data-field]');
    if (c) c.classList.remove('invalid');
  });

  function mark(el, msg){
    var c = el.closest('[data-field]');
    c.classList.add('invalid');
    if (msg) c.querySelector('.err').textContent = msg;
    return c;
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var ok = true, first = null;

    if (!exitDate.value){
      first = first || mark(exitDate, 'This is a required question'); ok = false;
    } else if (record.joiningDate && exitDate.value < record.joiningDate){
      first = first || mark(exitDate, 'Exit date cannot be before the joining date'); ok = false;
    }
    if (!reason.value.trim()){ first = first || mark(reason); ok = false; }
    if (!rating){ first = first || mark(document.getElementById('stars')); ok = false; }
    var accept = form.querySelector('input[name="employementAccept"]:checked');
    if (!accept){ first = first || mark(form.querySelector('input[name="employementAccept"]')); ok = false; }

    if (!ok){ first.scrollIntoView({behavior:'smooth', block:'center'}); return; }

    var payload = Object.assign({}, record, {
      exitDate: exitDate.value,
      reasonForLeaving: reason.value.trim(),
      rating: rating,
      employementAccept: accept.value,
      submittedAt: new Date().toISOString()
    });

    // ---- THIS IS THE SUBMIT -> CONSOLE STEP ----
    console.log('Enquiry form submitted:', payload);
    console.log(JSON.stringify(payload, null, 2));

    var out = document.getElementById('out');
    document.getElementById('outJson').textContent = JSON.stringify(payload, null, 2);
    out.classList.add('show');
    out.scrollIntoView({behavior:'smooth', block:'start'});
  });

  document.getElementById('clearBtn').addEventListener('click', function(){
    form.reset();
    rating = null;
    starBtns.forEach(function(x){ x.classList.remove('on'); });
    ratingLbl.textContent = 'Not rated';
    document.getElementById('out').classList.remove('show');
    form.querySelectorAll('[data-field]').forEach(function(c){ c.classList.remove('invalid'); });
  });
})();
