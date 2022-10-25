hbspt.forms.create({
  portalId: '40268',
  formId: '3e1bda09-785d-4439-a701-a16e771e710b',
  onFormReady: function($form) {
    $form.find("input[type='submit']").click(function(e) {
      const prodSelect = $('.hubspot-form-container')
        .contents()
        .find('select[name="product_category"]');
      const ssdSelect = $('.hubspot-form-container')
        .contents()
        .find('select[name="pny_part_number_ssd_"]');
      let selectedSSD = ssdSelect.find('option:selected').text();
      const portableSSD1050 = selectedSSD.indexOf('CS1050');
      const portableSSD2060 = selectedSSD.indexOf('CS2060');

      console.log('Clicked');
      console.log(prodSelect.find('option:selected').text());
      console.log(selectedSSD);
      console.log(verifySerial());

      if (prodSelect.find('option:selected').text() === 'Solid-State Drives') {
        if (portableSSD1050 > -1 || portableSSD2060 > -1) {
          if (!verifySerial()) {
            e.preventDefault();
            alert('Please enter a valid registration code.');
          } else {
            console.log('Valid registration code submitted');
            fetchCode();
          }
        }
      }
    });
  }
});

function fetchCode() {
  const contactEmail = $('.hubspot-form-container')
    .contents()
    .find('input[name="email"]')
    .val();
  const data = {
    email: contactEmail
  };
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };
  console.log('Code fetched');
  fetch('https://acronis-api.herokuapp.com/api/FpHt4wA@*YN7z9&h', options)
    .then(response => console.log(response))
    .catch(err => console.log(err));
}

Date.prototype.getWeek = function() {
  var oneJan = new Date(this.getFullYear(), 0, 1);
  return Math.ceil(((this - oneJan) / 86400000 + oneJan.getDay() + 1) / 7);
};

function verifySerial() {
  const serialNum = $('.hubspot-form-container')
    .contents()
    .find('input[name="portable_ssd_registration_code_for_acronis"]')
    .val();
  var weekNumber = new Date().getWeek();
  var yearNumber = new Date()
    .getFullYear()
    .toString()
    .slice(2);
  var model = serialNum.slice(0, 4);
  var cap = serialNum.slice(4, 7);
  var week = serialNum.slice(7, 9);
  var year = serialNum.slice(9, 11);
  var check = serialNum.slice(11, 12);
  var validModel;
  var validCap;
  var validCheck;
  var validWeek;
  var validYear;
  var validSerialNum;

  if (model == '1050' || model == '2060') {
    validModel = true;
  }

  if (
    cap == '240' ||
    cap == '250' ||
    cap == '480' ||
    cap == '500' ||
    cap == '960' ||
    cap == '1TB'
  ) {
    validCap = true;
  }

  if (check == 8) {
    validCheck = true;
  }

  if (week <= weekNumber) {
    validWeek = true;
  }

  if (year <= yearNumber) {
    validYear = true;
  }

  if (validModel && validCap && validCheck && validWeek && validYear) {
    validSerialNum = true;
  } else {
    validSerialNum = false;
  }
  return validSerialNum;
}
