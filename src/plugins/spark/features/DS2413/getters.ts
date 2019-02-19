import { blockById } from '@/plugins/spark/store/getters';
import { RootStore } from '@/store/state';
import { DS2413Block } from './state';

export const typeName = 'DS2413';

export const getById =
  (store: RootStore, serviceId: string, id: string): DS2413Block =>
    blockById<DS2413Block>(store, serviceId, id, typeName);
