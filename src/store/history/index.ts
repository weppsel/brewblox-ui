import Vue from 'vue';
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';

import store from '@/store';

import * as api from './api';
import { Listener, QueryParams, QueryResult, QueryTarget } from './types';
export * from './types';

const rawError = true;

@Module({ store, namespaced: true, dynamic: true, name: 'history' })
export class HistoryModule extends VuexModule {
  public fields: Mapped<string[]> = {};
  public listeners: Mapped<Listener> = {};

  public get listenerIds(): string[] {
    return Object.keys(this.listeners);
  }

  public get listenerValues(): Listener[] {
    return Object.values(this.listeners);
  }

  public get measurements(): string[] {
    return Object.keys(this.fields);
  }

  public get listenerById(): (id: string) => Listener {
    return (id: string) => {
      const listener = this.listeners[id];
      if (listener === undefined) {
        throw new Error(`${id} not found in history store`);
      }
      return listener;
    };
  }

  public get tryListenerById(): (id: string) => Listener | null {
    return (id: string) => this.listeners[id] || null;
  }

  public get fieldsByMeasurement(): (measurement: string) => string[] {
    return (measurement: string) => this.fields[measurement];
  }

  @Mutation
  public commitListener(listener: Listener): void {
    Vue.set(this.listeners, listener.id, listener);
  }

  @Mutation
  public commitRemoveListener(listener: Listener): void {
    Vue.delete(this.listeners, listener.id);
  }

  @Mutation
  public transform({ id, result }: { id: string; result: QueryResult }): void {
    const listener = this.listeners[id];
    if (listener !== undefined) {
      Vue.set(this.listeners, id, { ...listener.transformer(listener, result) });
    }
  }

  @Mutation
  public commitAllFields(fields: Mapped<string[]>): void {
    this.fields = { ...fields };
  }

  @Action({ rawError })
  public async addListener(args: {
    listener: Listener;
    fetcher: (p: QueryParams, t: QueryTarget) => Promise<EventSource>;
  }): Promise<void> {
    const { listener, fetcher } = args;
    const { id, params, target } = listener;

    this.commitListener(listener);

    const source = await fetcher(params, target);
    source.onmessage = (event: MessageEvent) =>
      this.transform({ id, result: JSON.parse(event.data) });
    source.onerror = () => source.close();

    this.commitListener({ ...this.listeners[id], id, source });
  }

  @Action({ rawError })
  public async addValuesListener(listener: Listener): Promise<Listener> {
    await this.addListener({ listener, fetcher: api.subscribeValues });
    return this.listeners[listener.id];
  }

  @Action({ rawError })
  public async addMetricsListener(listener: Listener): Promise<Listener> {
    await this.addListener({ listener, fetcher: api.subscribeMetrics });
    return this.listeners[listener.id];
  }

  @Action({ rawError })
  public async removeListener(listener: Listener): Promise<void> {
    this.commitRemoveListener(listener);
    if (listener.source) {
      listener.source.close();
    }
  }

  @Action({ rawError })
  public async fetchKnownKeys(): Promise<void> {
    this.commitAllFields(await api.fetchKnownKeys());
  }

  @Action({ rawError })
  public async fetchValues([params, target]: [QueryParams, QueryTarget]): Promise<QueryResult> {
    return await api.fetchValues(params, target);
  }

  @Action({ rawError })
  public async validateService(): Promise<boolean> {
    return await api.validateService();
  }
}

export const historyStore = getModule(HistoryModule);
