# Plain Token

一个偏二次元气质的静态博客页面。参考 `XinghuisamaBlogs` 的毛玻璃、个人信息卡、背景图、文章展示和碎碎念氛围，但保留本仓库的轻量形态：纯 HTML / CSS / JavaScript / JSON，无构建步骤。

## 当前页面

- 首页：主视觉、站点统计、文章列表、搜索、标签筛选、个人卡片、夜间电台和碎碎念。
- 文章页：封面、元信息、标签、目录、正文排版、阅读进度。
- 关于页：站点定位和素材位说明。
- 主题：默认浅色，右上角可切换夜间主题。

## 项目结构

```text
/
|-- index.html
|-- css/
|   `-- style.css
|-- js/
|   `-- app.js
|-- data/
|   `-- posts.json
|-- scripts/
|   `-- validate-content.mjs
|-- assets/
|   `-- README.md
|-- screenshot.mjs
|-- package.json
`-- README.md
```

## 本地运行

```bash
npm run serve
```

然后访问：

```text
http://localhost:8080
```

## 更新文章

文章数据在 `data/posts.json`。每篇文章支持：

- `title`：标题
- `date`：发布日期
- `tags`：标签数组
- `readTime` / `minutes`：阅读时长展示和统计
- `mood`：文章情绪标签
- `cover`：封面图片路径
- `excerpt`：摘要
- `body`：HTML 正文

更新后运行内容校验，避免把未来日期、错误日期格式或不存在的封面路径提交上去：

```bash
node scripts/validate-content.mjs
```

如果需要按指定日期检查，例如今天是 2026-06-12：

```bash
$env:PLAIN_TOKEN_TODAY='2026-06-12'; node scripts/validate-content.mjs
```

## 上传图片

图片路径约定见 `assets/README.md`。当前已经包含一套占位图片；后续覆盖同名文件后，页面会自动使用你的素材。

## 截图检查

先启动本地服务，再运行：

```bash
npm run screenshots
```

截图会输出到 `screenshots/`。
