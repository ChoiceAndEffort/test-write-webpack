const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const babel = require('@babel/core');

let globalId = 0;

// 1. 读取入口文件
function createAsset(filename) {
  const content = fs.readFileSync(filename, 'utf-8');
  const ast = parse(content, {
    sourceType: 'module'
  });

  const dependencies = [];
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependencies.push(node.source.value);
    }
  });

  const { code } = babel.transformFromAst(ast, null, {
    presets: ['@babel/preset-env']
  });

  return {
    id: globalId++,
    filename,
    dependencies,
    code
  };
}

// 2. 解析依赖模块
function createGraph(entry) {
  // 创建入口模块
  const mainAsset = createAsset(entry);
  // 创建模块队列，并将入口模块放入
  const queue = [mainAsset];
  for (const asset of queue) {
    const dirname = path.dirname(asset.filename);
    asset.map = {};
    asset.dependencies.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath);
      const child = createAsset(absolutePath);
      // 创建子模块Id与路径的映射关系
      asset.map[relativePath] = child.id;
      queue.push(child);
    });
  }
  return queue;
}

// 3. 打包输出文件
function bundle(graph) {
  let modules = '';
  // 对依赖模块进行处理
  graph.forEach((mod) => {
    modules += `${mod.id}: [
       function (require, module, exports) {
         ${mod.code}
       },
       ${JSON.stringify(mod.map)},
     ],`;
  });
  // 进行逻辑整合
  const result = `
    (function(modules) {
     function moduleEnv(filename) {
       const [code, map] = modules[filename];
       
       // 提供模块编号取出相应模块的方法
       // 依赖编号是根据依赖文件与依赖模块编号的映射关系取得
       function require(name) {
         return moduleEnv(map[name])
       }

       // 提供依赖挂载对象
       const module = { exports: {} }
     
       // 为模块注入依赖引入和模块挂载解释器
       code(require, module, module.exports)

       // 返回挂载完成的依赖模块
       return module.exports
     }
     moduleEnv(0)
    })({${modules}})
  `;
  return result;
}

// 测试打包过程
const graph = createGraph('./src/index.js');
const result = bundle(graph);
fs.writeFileSync('./dist/main.js', result);
