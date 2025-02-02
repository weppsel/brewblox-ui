<script lang="ts">
import { Component } from 'vue-property-decorator';

import WizardTaskBase from '@/components/Wizard/WizardTaskBase';
import { convertedTemp, Unit } from '@/helpers/units';
import { sparkStore } from '@/plugins/spark/store';

import { createOutputActions } from '../helpers';
import { defineChangedBlocks, defineCreatedBlocks, defineWidgets } from './changes';
import { defineLayouts } from './changes-layout';
import { GlycolConfig, GlycolOpts } from './types';

@Component
export default class GlycolSettingsTask extends WizardTaskBase<GlycolConfig> {
  beerSetting = new Unit(20, 'degC');
  glycolSetting = new Unit(4, 'degC');


  done(): void {
    const opts: GlycolOpts = { beerSetting: this.beerSetting, glycolSetting: this.glycolSetting };
    const createdBlocks = defineCreatedBlocks(this.config, opts);
    const changedBlocks = defineChangedBlocks(this.config);
    const layouts = defineLayouts(this.config);
    const widgets = defineWidgets(this.config, layouts);

    this.pushActions(createOutputActions());
    this.updateConfig({
      ...this.config,
      layouts,
      widgets,
      changedBlocks,
      createdBlocks,
    });
    this.next();
  }

  created(): void {
    const unit = sparkStore.units(this.config.serviceId).Temp;
    this.beerSetting = convertedTemp(20, unit);
    this.glycolSetting = convertedTemp(4, unit);
  }
}
</script>

<template>
  <div>
    <q-card-section>
      <q-item dark class="text-weight-light">
        <q-item-section>
          <q-item-label class="text-subtitle1">
            Initial setpoints
          </q-item-label>
          <p v-if="config.glycolControl === 'Control'">
            The setup creates a setpoint for your beer temperature and your glycol temperature.
          </p>
          <p v-else>
            The setup creates a setpoint for your beer temperature.
          </p>
          <p>You can set the initial values now.</p>
        </q-item-section>
      </q-item>
      <q-item dark>
        <q-item-section>
          <q-item-label caption>
            Beer setpoint
          </q-item-label>
          <UnitField v-model="beerSetting" title="Beer setting" />
        </q-item-section>
        <q-item-section v-if="config.glycolControl==='Control'">
          <q-item-label caption>
            Glycol setpoint
          </q-item-label>
          <UnitField v-model="glycolSetting" title="Glycol setting" />
        </q-item-section>
        <q-item-section v-else />
      </q-item>
    </q-card-section>

    <q-separator dark />

    <q-card-actions>
      <q-btn unelevated label="Back" @click="back" />
      <q-space />
      <q-btn unelevated label="Done" color="primary" @click="done" />
    </q-card-actions>
  </div>
</template>
