import { ref } from '@/helpers/component-ref';
import { QuickStart } from '@/store/features';

import RimsHardwareTask from './RimsHardwareTask.vue';
import RimsManualTask from './RimsManualTask.vue';
import RimsNamingTask from './RimsNamingTask.vue';
import RimsWizard from './RimsWizard.vue';

ref(RimsHardwareTask);
ref(RimsManualTask);
ref(RimsNamingTask);

const quickStart: QuickStart = {
  id: 'Rims',
  displayName: 'RIMS Brew-in-a-Bag',
  wizard: ref(RimsWizard),
};

export default quickStart;
