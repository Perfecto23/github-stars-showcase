import { execSync } from 'node:child_process';

function runScript(scriptName: string) {
  execSync(`pnpm run ${scriptName}`, { stdio: 'inherit' });
}

async function main() {
  console.log('🚀 开始更新 GitHub Stars 数据...\n');

  try {
    console.log('📥 步骤 1/4: 获取 starred 仓库...');
    runScript('fetch-stars');

    console.log('\n🤖 步骤 2/4: AI 批量分析仓库...');
    runScript('analyze');

    console.log('\n📊 步骤 3/4: 生成最终数据...');
    runScript('generate-data');

    console.log('\n🏗️  步骤 4/4: 构建静态网站...');
    runScript('build');

    console.log('\n✅ 更新完成！');
    console.log('💡 提示：');
    console.log('  - 运行 pnpm run dev 预览开发版本');
    console.log('  - 运行 npx serve out 预览生产版本');
    console.log('  - 将 out/ 目录部署到腾讯云 EdgeOne Pages');
  } catch (error) {
    console.error('\n❌ 更新失败:', (error as Error).message);
    process.exit(1);
  }
}

main().catch(console.error);
