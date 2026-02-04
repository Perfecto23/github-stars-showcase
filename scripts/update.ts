import { execSync } from 'node:child_process';

async function main() {
  console.log('🚀 开始更新 GitHub Stars 数据...\n');

  try {
    // 1. 获取 starred 仓库
    console.log('📥 步骤 1/4: 获取 starred 仓库...');
    execSync('npx tsx scripts/fetch-stars.ts', { stdio: 'inherit' });

    // 2. AI 批量分析
    console.log('\n🤖 步骤 2/4: AI 批量分析仓库...');
    execSync('npx tsx scripts/analyze-repos.ts', { stdio: 'inherit' });

    // 3. 生成最终数据
    console.log('\n📊 步骤 3/4: 生成最终数据...');
    execSync('npx tsx scripts/generate-data.ts', { stdio: 'inherit' });

    // 4. 构建静态网站
    console.log('\n🏗️  步骤 4/4: 构建静态网站...');
    execSync('npm run build', { stdio: 'inherit' });

    console.log('\n✅ 更新完成！');
    console.log('💡 提示：');
    console.log('  - 运行 npm run dev 预览开发版本');
    console.log('  - 运行 npx serve out 预览生产版本');
    console.log('  - 将 out/ 目录部署到腾讯云 EdgeOne Pages');
  } catch (error) {
    console.error('\n❌ 更新失败:', (error as Error).message);
    process.exit(1);
  }
}

main().catch(console.error);
