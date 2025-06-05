// Action Types
export const SET_USER = 'SET_USER';

// Action Creators
export const setUser = (user: any) => ({
  type: SET_USER,
  payload: user,
}); 