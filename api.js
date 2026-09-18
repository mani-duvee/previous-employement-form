/**
 * API Service & Endpoints Configuration
 * Backend Base URI: https://13.127.219.134
 */

(function (window) {
  'use strict';

  // Base backend URL: prioritizes query param ?apiBase=..., window.ENV.API_BASE_URL, or default sample URI
  function getBaseUrl() {
    if (typeof window !== 'undefined') {
      try {
        var params = new URLSearchParams(window.location.search);
        var apiBase = params.get('apiBase');
        if (apiBase) return apiBase.replace(/\/+$/, '');
      } catch (e) {}

      if (window.ENV && window.ENV.API_BASE_URL) {
        return window.ENV.API_BASE_URL.replace(/\/+$/, '');
      }
      if (window.API_BASE_URL) {
        return window.API_BASE_URL.replace(/\/+$/, '');
      }
    }
    return 'https://13.127.219.134';
  }

  // 3 Central Endpoints dictionary as specified:
  // {"send_otp":"/api/v1/...","conform_otp":"","fetch_data":""}
  var endpoints = {
    fetch_data: "/api/v1/public/previous-employment/verify",
    send_otp: "/api/v1/public/employee-employment/verify/send-otp",
    conform_otp: "/api/v1/public/employee-employment/verify/confirm-otp"
  };

  /**
   * Helper to build full URL with endpoint & query params
   */
  function buildUrl(endpointPath, queryParams) {
    var base = getBaseUrl();
    var url = (base ? base : '') + endpointPath;
    if (queryParams && typeof queryParams === 'object') {
      var searchParams = new URLSearchParams();
      Object.keys(queryParams).forEach(function (key) {
        if (queryParams[key] !== undefined && queryParams[key] !== null && queryParams[key] !== '') {
          searchParams.append(key, queryParams[key]);
        }
      });
      var qs = searchParams.toString();
      if (qs) {
        url += (url.indexOf('?') === -1 ? '?' : '&') + qs;
      }
    }
    return url;
  }

  /**
   * 1. fetch_data API call:
   * GET /api/v1/public/previous-employment/verify?keyword=<keyword>
   */
  async function apiFetchData(keyword) {
    var url = buildUrl(endpoints.fetch_data, { keyword: keyword });
    console.log("[API:fetch_data] Requesting:", url);
    var response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('API request failed with status ' + response.status + ' (' + response.statusText + ')');
    }
    return response.json();
  }

  /**
   * 2. send_otp API call:
   * POST /api/v1/public/employee-employment/verify/send-otp?keyword=<keyword>
   * Body: { "contactNumber": "9876543210", "keyword": keyword }
   */
  async function apiSendOtp(keyword, contactNumber) {
    var url = buildUrl(endpoints.send_otp, { keyword: keyword });
    console.log("[API:send_otp] Requesting:", url, "Payload:", { contactNumber: contactNumber });
    var response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        contactNumber: contactNumber,
        keyword: keyword || undefined
      })
    });
    var result = null;
    try {
      result = await response.json();
    } catch (e) {}
    if (!response.ok && (!result || result.status === false)) {
      throw new Error((result && result.message) || ('HTTP ' + response.status + ' ' + response.statusText));
    }
    return result || { status: true, message: 'OTP sent successfully' };
  }

  /**
   * 3. conform_otp API call:
   * POST /api/v1/public/employee-employment/verify/confirm-otp?keyword=<keyword>
   * Body: { "otp": "...", "verificationStatus": "...", "employeeEmploymentStatus": "...", "reasonForLeaving": "..." }
   */
  async function apiConfirmOtp(keyword, payload) {
    var url = buildUrl(endpoints.conform_otp, { keyword: keyword });
    console.log("[API:conform_otp] Requesting:", url, "Payload:", payload);
    var response = await fetch(url, {
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
    if (!response.ok && (!result || result.status === false)) {
      throw new Error((result && result.message) || ('HTTP ' + response.status + ' ' + response.statusText));
    }
    return result || { status: true, message: 'Clearance verified successfully' };
  }

  // Expose API module and endpoints directly on window
  window.endpoints = endpoints;
  window.API_SERVICE = {
    getBaseUrl: getBaseUrl,
    endpoints: endpoints,
    buildUrl: buildUrl,
    fetchData: apiFetchData,
    sendOtp: apiSendOtp,
    confirmOtp: apiConfirmOtp
  };

})(window);
