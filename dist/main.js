(function (modules) {
  function moduleEnv(filename) {
    const [code, map] = modules[filename];

    // 提供模块编号取出相应模块的方法
    // 依赖编号是根据依赖文件与依赖模块编号的映射关系取得
    function require(name) {
      return moduleEnv(map[name]);
    }

    // 提供依赖挂载对象
    const module = { exports: {} };

    // 为模块注入依赖引入和模块挂载解释器
    code(require, module, module.exports);

    // 返回挂载完成的依赖模块
    return module.exports;
  }
  moduleEnv(0);
})({
  0: [
    function (require, module, exports) {
      'use strict';

      var _add = require('./add.js');
      console.log((0, _add.add)(1, 2));
    },
    { './add.js': 1 }
  ],
  1: [
    function (require, module, exports) {
      'use strict';

      Object.defineProperty(exports, '__esModule', {
        value: true
      });
      exports.add = void 0;
      const add = (a, b) => {
        return a + b;
      };
      exports.add = add;
    },
    {}
  ]
});
