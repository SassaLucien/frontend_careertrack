export let tempUserData = null;
export let currentLoggedInUser = null;

export const setTempUserData = (data) => {
  tempUserData = data;
};

export const clearTempUserData = () => {
  tempUserData = null;
};

export const setCurrentLoggedInUser = (user) => {
  currentLoggedInUser = user;
};

export const getCurrentLoggedInUser = () => {
  return currentLoggedInUser;
};

export const clearCurrentLoggedInUser = () => {
  currentLoggedInUser = null;
};
