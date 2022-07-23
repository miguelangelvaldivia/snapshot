import { ref, computed } from 'vue';
import { clone, validateSchema } from '@snapshot-labs/snapshot.js/src/utils';
import schemas from '@snapshot-labs/snapshot.js/src/schemas';
import { useValidationErrors } from '@/composables/useValidationErrors';
import { watchDebounced } from '@vueuse/core';

const SPACE_OBJECT = {
  strategies: [],
  categories: [],
  treasuries: [],
  admins: [],
  members: [],
  plugins: {},
  filters: {
    minScore: 0,
    onlyMembers: false
  },
  voting: {
    delay: 0,
    hideAbstain: false,
    period: 0,
    quorum: 0,
    type: ''
  },
  validation: { name: 'basic', params: {} },
  name: '',
  about: '',
  avatar: '',
  network: '1',
  symbol: '',
  terms: '',
  website: '',
  twitter: '',
  github: '',
  parent: null,
  children: [],
  private: false,
  domain: '',
  skin: ''
};
const BASIC_VALIDATION = { name: 'basic', params: {} };

const formSetup = ref(clone(SPACE_OBJECT));
const formSettings = ref(clone(SPACE_OBJECT));
const showAllValidationErrors = ref(false);

export function useSpaceForm(context: 'setup' | 'settings') {
  const form = computed({
    get: () => (context === 'setup' ? formSetup.value : formSettings.value),
    set: newVal =>
      context === 'setup'
        ? (formSetup.value = newVal)
        : (formSettings.value = newVal)
  });

  const validationResult = ref<ReturnType<typeof validateSchema>>(null);
  const isValid = computed(() => validationResult.value === true);

  const validate = () => {
    const formattedForm = formatSpace(form.value);

    validationResult.value = validateSchema(schemas.space, formattedForm);
  };

  watchDebounced(form, validate, { debounce: 200, maxWait: 1000, deep: true });

  function formatSpace(spaceRaw) {
    if (!spaceRaw) return;
    const space = clone(spaceRaw);
    if (!space) return;
    delete space.id;
    delete space.followersCount;
    if (space.filters.invalids) delete space.filters.invalids;
    Object.entries(space).forEach(([key, value]) => {
      if (value === null || value === '') delete space[key];
    });
    space.strategies = space.strategies || [];
    space.plugins = space.plugins || {};
    space.validation = space.validation || BASIC_VALIDATION;
    space.filters = space.filters || {};
    space.voting = space.voting || {};
    space.voting.delay = space.voting?.delay || undefined;
    space.voting.period = space.voting?.period || undefined;
    space.voting.type = space.voting?.type || undefined;
    space.voting.quorum = space.voting?.quorum || undefined;
    return space;
  }

  const { validationErrorMessage } = useValidationErrors();

  function getErrorMessage(field: string): { message: string; push: boolean } {
    const message = validationErrorMessage(field, validationResult.value);
    return {
      message: message || '',
      push: showAllValidationErrors.value
    };
  }

  function resetForm() {
    form.value = clone(SPACE_OBJECT);
    showAllValidationErrors.value = false;
  }

  function setDefaultStrategy() {
    form.value.strategies = [];
    form.value.strategies.push({
      name: 'ticket',
      network: '1',
      params: {
        symbol: 'VOTE'
      }
    });
    form.value.symbol = 'VOTE';
  }

  return {
    form,
    validationResult,
    isValid,
    showAllValidationErrors,
    formatSpace,
    getErrorMessage,
    resetForm,
    setDefaultStrategy
  };
}