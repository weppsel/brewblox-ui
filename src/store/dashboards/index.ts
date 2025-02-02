import Vue from 'vue';
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';

import { objReducer } from '@/helpers/functional';
import store from '@/store';

import { dashboardApi, itemApi } from './api';
import { Dashboard, DashboardItem } from './types';
export * from './types';

const rawError = true;

@Module({ store, namespaced: true, dynamic: true, name: 'dashboards' })
export class DashboardModule extends VuexModule {
  public replicatingDashboards = false;
  public dashboards: Record<string, Dashboard> = {};

  public replicatingItems = false;
  public items: Record<string, DashboardItem> = {};

  public get dashboardIds(): string[] {
    return Object.keys(this.dashboards);
  }

  public get dashboardValues(): Dashboard[] {
    return Object.values(this.dashboards);
  }

  public get itemIds(): string[] {
    return Object.keys(this.items);
  }

  public get itemValues(): DashboardItem[] {
    return Object.values(this.items);
  }

  public get primaryDashboardId(): string | null {
    const sorted = Object
      .values(this.dashboards)
      .sort((left, right) => {
        if (left.primary && !right.primary) {
          return -1;
        }
        if (!left.primary && right.primary) {
          return 1;
        }
        return left.order - right.order;
      });
    return sorted.length > 0
      ? sorted[0].id
      : null;
  }

  public get dashboardById(): (id: string) => Dashboard {
    return id => this.dashboards[id];
  }

  public get dashboardItemById(): (id: string) => DashboardItem {
    return id => this.items[id];
  }

  public get dashboardItemsByDashboardId(): (id: string) => DashboardItem[] {
    return id => this.itemValues.filter(item => item.dashboard === id);
  }

  @Mutation
  public commitDashboard(dashboard: Dashboard): void {
    Vue.set(this.dashboards, dashboard.id, { ...dashboard });
  }

  @Mutation
  public commitAllDashboards(dashboards: Dashboard[]): void {
    this.dashboards = dashboards.reduce(objReducer('id'), {});
  }

  @Mutation
  public commitRemoveDashboard(dashboard: Dashboard): void {
    Vue.delete(this.dashboards, dashboard.id);
  }

  @Mutation
  public commitReplicatingDashboards(val: boolean): void {
    this.replicatingDashboards = val;
  }

  @Mutation
  public commitDashboardItem(item: DashboardItem): void {
    Vue.set(this.items, item.id, { ...item });
  }

  @Mutation
  public commitAllDashboardItems(items: DashboardItem[]): void {
    this.items = items.reduce(objReducer('id'), {});
  }

  @Mutation
  public commitRemoveDashboardItem(item: DashboardItem): void {
    Vue.delete(this.items, item.id);
  }

  @Mutation
  public commitReplicatingItems(val: boolean): void {
    this.replicatingItems = val;
  }

  @Action({ rawError, commit: 'commitDashboard' })
  public async createDashboard(dashboard: Dashboard): Promise<Dashboard> {
    return await dashboardApi.create(dashboard);
  }

  @Action({ rawError, commit: 'commitDashboard' })
  public async saveDashboard(dashboard: Dashboard): Promise<Dashboard> {
    return await dashboardApi.persist(dashboard);
  }

  @Action({ rawError })
  public async updateDashboardOrder(ids: string[]): Promise<void> {
    await Promise.all(
      ids
        .map(async (id, index) =>
          await this.context.dispatch(
            'saveDashboard',
            { ...this.dashboards[id], order: index + 1 },
          )));
  }

  @Action({ rawError })
  public async updatePrimaryDashboard(newId: string | null): Promise<void> {
    await Promise.all(
      this.dashboardValues
        .reduce(
          (promises: Promise<void>[], dash: Dashboard) => {
            if (dash.id === newId) {
              promises.push(this.context.dispatch('saveDashboard', { ...dash, primary: true }));
            } else if (dash.primary) {
              promises.push(this.context.dispatch('saveDashboard', { ...dash, primary: false }));
            }
            return promises;
          },
          []
        ));
  }

  @Action({ rawError, commit: 'commitRemoveDashboard' })
  public async removeDashboard(dashboard: Dashboard): Promise<Dashboard> {
    this.dashboardItemsByDashboardId(dashboard.id)
      .forEach(item => this.context.dispatch('removeDashboardItem', item));
    await dashboardApi.remove(dashboard).catch(() => { });
    return dashboard;
  }

  @Action({ rawError, commit: 'commitDashboardItem' })
  public async createDashboardItem(item: DashboardItem): Promise<DashboardItem> {
    return await itemApi.create(item);
  }

  @Action({ rawError, commit: 'commitDashboardItem' })
  public async appendDashboardItem(item: DashboardItem): Promise<DashboardItem> {
    const order = this.dashboardItemsByDashboardId(item.dashboard).length + 1;
    return await itemApi.create({ ...item, order });
  }

  @Action({ rawError, commit: 'commitDashboardItem' })
  public async saveDashboardItem(item: DashboardItem): Promise<DashboardItem> {
    return await itemApi.persist(item);
  }

  @Action({ rawError })
  public async updateDashboardItemOrder(itemIds: string[]): Promise<void> {
    await Promise.all(
      itemIds
        .reduce(
          (promises: Promise<void>[], id, index) => {
            const item = this.dashboardItemById(id);
            const order = index + 1;
            if (item.order !== order) {
              promises.push(this.context.dispatch('saveDashboardItem', { ...item, order }));
            }
            return promises;
          },
          [],
        ));
  }

  @Action({ rawError })
  public async updateDashboardItemSize(
    { id, cols, rows }: { id: string; cols: number; rows: number }
  ): Promise<DashboardItem> {
    const item = this.dashboardItemById(id);
    return await this.context.dispatch('saveDashboardItem', { ...item, cols, rows });
  }

  @Action({ rawError })
  public async updateDashboardItemConfig({ id, config }: { id: string; config: any }): Promise<DashboardItem> {
    const item = this.dashboardItemById(id);
    return await this.context.dispatch('saveDashboardItem', { ...item, config });
  }

  @Action({ rawError, commit: 'commitRemoveDashboardItem' })
  public async removeDashboardItem(item: DashboardItem): Promise<DashboardItem> {
    await itemApi.remove(item).catch(() => { });
    return item;
  }

  @Action({ rawError })
  public async setup(): Promise<void> {
    /* eslint-disable no-underscore-dangle */
    const onDashboardChange = (dashboard: Dashboard): void => {
      const existing = this.dashboardById(dashboard.id);
      if (!existing || existing._rev !== dashboard._rev) {
        this.commitDashboard(dashboard);
      }
    };
    const onDashboardDelete = (id: string): void => {
      const existing = this.dashboardById(id);
      if (existing) {
        this.commitRemoveDashboard(existing);
      }
    };
    const onItemChange = (item: DashboardItem): void => {
      const existing = this.dashboardItemById(item.id);
      if (!existing || existing._rev !== item._rev) {
        this.commitDashboardItem(item);
      }
    };
    const onItemDelete = (id: string): void => {
      const existing = this.dashboardItemById(id);
      if (existing) {
        this.commitRemoveDashboardItem(existing);
      }
    };
    /* eslint-enable no-underscore-dangle */

    this.commitAllDashboards(await dashboardApi.fetch());
    this.commitAllDashboardItems(await itemApi.fetch());

    dashboardApi.setup(onDashboardChange, onDashboardDelete);
    itemApi.setup(onItemChange, onItemDelete);
  }
}

export const dashboardStore = getModule(DashboardModule);
