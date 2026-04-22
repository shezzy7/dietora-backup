import { createSlice } from '@reduxjs/toolkit'

const saved = localStorage.getItem('dietora_theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    dark: saved ? saved === 'dark' : prefersDark,
  },
  reducers: {
    toggleTheme(state) {
      state.dark = !state.dark
      localStorage.setItem('dietora_theme', state.dark ? 'dark' : 'light')
      if (state.dark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
    initTheme(state) {
      if (state.dark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
  },
})

export const { toggleTheme, initTheme } = themeSlice.actions
export default themeSlice.reducer
