import { SET_USER } from './actions';

interface UserState {
  user: any | null;
}

const initialState: UserState = {
  user: null,
};

export const userReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case SET_USER:
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
}; 