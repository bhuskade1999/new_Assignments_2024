exports.validateName = (value) => {
  const pattern = /^[A-Za-z\-\' ]+$/;
  return pattern.test(value);
};

exports.validateEmail = (value) => {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return pattern.test(value);
};

exports.validatePassword = (value) => {
  const pattern = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
  return pattern.test(value);
};

//console.log(validateName("123bhushan"));
