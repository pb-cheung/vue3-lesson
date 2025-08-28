import { reactive } from '@vue/reactivity';
import { isFunction } from '@vue/shared/src';
import { h } from './h';

export function defineAsyncComponent(options) {
  if (isFunction(options)) {
    options = { loader: options };
  }

  return {
    setup() {
      const {
        loader,
        errorComponent,
        timeout,
        delay,
        loadingComponent,
        onError,
      } = options;

      const state = reactive({
        loaded: false,
        loading: false,
        component: null,
        err: null,
      });

      let loadingTimer = null;
      if (delay) {
        loadingTimer = setTimeout(() => {
          if (!state.loaded) {
            state.loading = true;
          }
        }, delay);
      }

      let attempts = 0;
      function loadFunc() {
        return loader().catch((err) => {
          // 这里手动处理异常
          if (onError) {
            return new Promise((resolve, reject) => {
              const retry = () => resolve(loadFunc());
              const fail = () => reject(err);

              onError(err, retry, fail, ++attempts);
            });
          } else {
            throw err; // 将错误继续传递
          }
        });
      }

      // 异步加载组件
      loadFunc()
        .then((comp) => {
          state.loaded = true;
          state.component = comp;
        })
        .catch((error) => {
          state.err = error;
        })
        .finally(() => {
          // 无论成功失败，结束后都不需要切换成loading
          state.loading = false;
          clearTimeout(loadingTimer);
        });

      if (timeout) {
        setTimeout(() => {
          if (!state.loaded) {
            state.err = true;
            throw new Error('组件加载超时');
          }
        }, timeout);
      }

      const placeholder = h('div', 'placeholder Loading...');

      return () => {
        if (state.loaded) {
          return h(state.component);
        } else if (state.err && errorComponent) {
          return h(errorComponent);
        } else if (state.loading && loadingComponent) {
          return h(loadingComponent);
        }
        return placeholder;
      };
    },
  };
}
