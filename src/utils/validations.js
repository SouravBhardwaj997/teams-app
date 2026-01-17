export const validateEmail = (email) => {
  const re = /^\S+@\S+\.\S+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validateRequired = (fields, body) => {
  const errors = [];

  for (const field of fields) {
    if (!body[field] || body[field].trim() === "") {
      errors.push(`${field} is required`);
    }
  }

  return errors;
};
