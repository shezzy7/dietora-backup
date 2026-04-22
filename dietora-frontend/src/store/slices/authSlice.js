// src/store/slices/authSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

// ─── Thunks ───────────────────────────────────────────────

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials)
    localStorage.setItem('dietora_token', data.token)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed')
  }
})

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData)
    localStorage.setItem('dietora_token', data.token)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed')
  }
})

/**
 * googleLogin
 * Sends Google access_token to backend → backend verifies with Google userinfo API
 * → finds or creates user in MongoDB → returns DIETORA JWT
 *
 * payload: { accessToken: string }  (from useGoogleLogin implicit flow)
 */
export const googleLogin = createAsyncThunk('auth/google', async ({ accessToken }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/google', { accessToken })
    localStorage.setItem('dietora_token', data.token)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Google sign-in failed')
  }
})

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me')
    return data
  } catch (err) {
    localStorage.removeItem('dietora_token')
    return rejectWithValue(err.response?.data?.message || 'Session expired')
  }
})

// ─── Slice ────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('dietora_token'),
    loading: false,
    initialized: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null
      state.token = null
      state.initialized = true
      localStorage.removeItem('dietora_token')
      toast.success('Logged out successfully')
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {

    // ── Login ────────────────────────────────────────────
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.initialized = true
        const first = action.payload.user?.name?.split(' ')[0] || 'there'
        toast.success(`Welcome back, ${first}!`)
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })

    // ── Register ─────────────────────────────────────────
    builder
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.initialized = true
        toast.success('Account created! Welcome to DIETORA 🥗')
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })

    // ── Google Login ──────────────────────────────────────
    builder
      .addCase(googleLogin.pending, (state) => { state.loading = true; state.error = null })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.initialized = true
        // Backend sends the right welcome message
        toast.success(action.payload.message || 'Signed in with Google!')
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload || 'Google sign-in failed. Please try again.')
      })

    // ── Fetch Me ─────────────────────────────────────────
    builder
      .addCase(fetchMe.pending, (state) => { state.loading = true })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false
        // /auth/me returns { success: true, data: userObject }
        state.user = action.payload?.data || action.payload?.user || action.payload
        state.initialized = true
      })
      .addCase(fetchMe.rejected, (state) => {
        state.loading = false
        state.user = null
        state.token = null
        state.initialized = true
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
