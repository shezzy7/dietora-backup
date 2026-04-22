import { createContext, useContext, useState, useCallback } from 'react'

const ModalContext = createContext(null)

export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null)

  const openModal = useCallback((component, props = {}) => {
    setModal({ component, props })
  }, [])

  const closeModal = useCallback(() => {
    setModal(null)
  }, [])

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div onClick={(e) => e.stopPropagation()}>
            <modal.component {...modal.props} onClose={closeModal} />
          </div>
        </div>
      )}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}
