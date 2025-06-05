import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userService, BackendUser } from '../services/userService';

// Define the state shape
interface UserState {
  users: BackendUser[];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: UserState = {
  users: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchAllUsers = createAsyncThunk(
  'user/fetchAllUsers',
  async (token: string, { rejectWithValue }) => {
    try {
      return await userService.getAllUsers(token);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch users');
    }
  }
);

export const createUser = createAsyncThunk(
  'user/createUser',
  async ({ userData, token }: { userData: Partial<BackendUser>; token: string }, { rejectWithValue }) => {
    try {
      return await userService.createUser(userData, token);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'user/updateUser',
  async ({ userId, userData, token }: { userId: string; userData: Partial<BackendUser>; token: string }, { rejectWithValue }) => {
    try {
      return await userService.updateUser(userId, userData, token);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update user');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'user/deleteUser',
  async ({ userId, token }: { userId: string; token: string }, { rejectWithValue }) => {
    try {
      await userService.deleteUser(userId, token);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete user');
    }
  }
);

// User slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Synchronous actions for optimistic updates
    addUserOptimistic: (state, action: PayloadAction<BackendUser>) => {
      state.users.push(action.payload);
    },
    updateUserOptimistic: (state, action: PayloadAction<BackendUser>) => {
      const index = state.users.findIndex(user => user.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    removeUserOptimistic: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(user => user.id !== action.payload);
    },
    // Error handling
    clearError: (state) => {
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    // Loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    // Reset state
    resetState: (state) => {
      state.users = [];
      state.isLoading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all users
      .addCase(fetchAllUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action: PayloadAction<BackendUser[]>) => {
        state.isLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch users';
        state.users = [];
      })
      // Create user
      .addCase(createUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action: PayloadAction<BackendUser>) => {
        state.isLoading = false;
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to create user';
      })
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<BackendUser>) => {
        state.isLoading = false;
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to update user';
      })
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.users = state.users.filter(user => user.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to delete user';
      });
  },
});

export const { 
  addUserOptimistic, 
  updateUserOptimistic, 
  removeUserOptimistic,
  clearError,
  setError,
  setLoading,
  resetState
} = userSlice.actions;

export default userSlice.reducer; 