export const KeepAlive = {
  __isKeepAlive: true,
  setup(props, { slots }) {
    return () => {
      const vnode = slots.default();

      return vnode;
    };
  },
};

export const isKeepAlive = (value) => value.__isKeepAlive;
