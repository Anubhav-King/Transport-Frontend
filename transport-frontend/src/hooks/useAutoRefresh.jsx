import { useEffect } from 'react';
import { useEvent } from '../context/EventContext';

export const useAutoRefresh = (callback) => {
  const { eventKey } = useEvent();

  useEffect(() => {
    callback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventKey]);
};
