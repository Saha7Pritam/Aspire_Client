import { createContext, useContext, useState, useCallback } from 'react';

const PushLockContext = createContext(null);

export function PushLockProvider({ children }) {
  const [activeSkuId, setActiveSkuId] = useState(null);

  const acquireLock = useCallback((skuId) => {
    setActiveSkuId((current) => (current && current !== skuId ? current : skuId));
  }, []);

  const releaseLock = useCallback((skuId) => {
    setActiveSkuId((current) => (current === skuId ? null : current));
  }, []);

  return (
    <PushLockContext.Provider value={{ activeSkuId, acquireLock, releaseLock }}>
      {children}
    </PushLockContext.Provider>
  );
}

export function usePushLock() {
  const ctx = useContext(PushLockContext);
  if (!ctx) throw new Error('usePushLock must be used within a PushLockProvider');
  return ctx;
}