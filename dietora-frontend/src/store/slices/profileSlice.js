import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

export const fetchProfile = createAsyncThunk('profile/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/profile')
    return data
  } catch (err) {
    // 404 = no profile yet — that's normal, not an error
    if (err.response?.status === 404) return null
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile')
  }
})

export const saveProfile = createAsyncThunk('profile/save', async (profileData, { getState, rejectWithValue }) => {
  try {
    const existing = getState().profile.data
    // Use PUT if profile exists, POST if creating for first time
    const method = existing ? 'put' : 'post'
    const { data } = await api[method]('/profile', profileData)
    toast.success(existing ? 'Health profile updated!' : 'Health profile created!')
    return data
  } catch (err) {
    const msg = err.response?.data?.message || 'Failed to save profile'
    return rejectWithValue(msg)
  }
})

const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    data: null,
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearProfile(state) {
      state.data = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload?.data?.healthProfile || action.payload?.data || action.payload
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(saveProfile.pending, (state) => { state.saving = true; state.error = null })
      .addCase(saveProfile.fulfilled, (state, action) => {
        state.saving = false
        state.data = action.payload?.data?.healthProfile || action.payload?.data || action.payload
      })
      .addCase(saveProfile.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload
        toast.error(action.payload)
      })
  },
})

export const { clearProfile } = profileSlice.actions
export default profileSlice.reducer
