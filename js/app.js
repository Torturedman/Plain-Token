;(function () {
  'use strict'

  let posts = []
  let activeTag = null
  let activeSearch = ''

  const mainContent = document.getElementById('main-content')
  const navLinks = document.querySelectorAll('[data-route]')
  const progressBar = document.getElementById('reading-progress')
  const backToTop = document.getElementById('back-to-top')
  const themeToggle = document.getElementById('theme-toggle')

  const notes = [
    '把文章写成能被反复打开的存档，而不是一次性动态。',
    '头像、封面、角色图会让站点从清爽样机变成完整档案。',
    '偏爱有秩序的可爱：清爽、透明、带一点游戏 UI 的节奏。'
  ]

  function getRoute() {
    const hash = location.hash.slice(1) || '/'
    const parts = hash.split('/').filter(Boolean)

    if (parts.length === 0) return { page: 'home' }
    if (parts[0] === 'tag' && parts[1]) return { page: 'home', tag: decodeURIComponent(parts[1]) }
    if (parts[0] === 'post' && parts[1]) return { page: 'post', slug: decodeURIComponent(parts[1]) }
    if (parts[0] === 'about') return { page: 'about' }

    return { page: '404' }
  }

  function dispatch() {
    window.removeEventListener('scroll', onTOCScroll)
    const route = getRoute()

    if (route.page === 'home') {
      updateNav('home')
      activeSearch = ''
      renderHome(route.tag || null, '')
      return
    }

    if (route.page === 'post') {
      updateNav('home')
      renderPost(route.slug)
      return
    }

    if (route.page === 'about') {
      updateNav('about')
      renderAbout()
      return
    }

    updateNav('')
    render404()
  }

  function updateNav(page) {
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.route === page)
    })
  }

  function renderHome(tag, searchTerm) {
    activeTag = tag
    activeSearch = searchTerm || ''

    const latest = posts[0]
    const filtered = getFilteredPosts(activeTag, activeSearch)
    const allTags = getAllTags()
    const totalReadMinutes = posts.reduce((sum, post) => sum + Number(post.minutes || 0), 0)

    mainContent.innerHTML = `
      <section class="hero" aria-labelledby="home-title">
        <div class="hero-copy">
          <p class="eyebrow">After School Archive</p>
          <h1 class="hero-title" id="home-title">星屑放映室里的工程日记</h1>
          <p class="hero-subtitle">这里记录前端、AI 工具和个人创作。视觉保持轻二次元的透明感，头像、封面与角色图会让这里更像一间私人的放映室。</p>
          <div class="hero-actions">
            <a class="primary-link" href="#/post/${encodeURIComponent(slugOf(latest))}">读最新文章</a>
            <a class="secondary-link" href="#/about">关于这个站点</a>
          </div>
          <div class="stats-strip" aria-label="站点统计">
            <span class="stat-tile"><strong class="stat-value">${posts.length}</strong><span class="stat-label">篇文章</span></span>
            <span class="stat-tile"><strong class="stat-value">${allTags.length}</strong><span class="stat-label">个标签</span></span>
            <span class="stat-tile"><strong class="stat-value">${totalReadMinutes}</strong><span class="stat-label">分钟阅读</span></span>
          </div>
        </div>

        <div class="hero-stage" aria-label="博客主视觉">
          <div class="scene-card">
            <strong>${escHtml(latest.title)}</strong>
            <span>${escHtml(latest.excerpt)}</span>
          </div>
          <div class="character-stand" aria-hidden="true"></div>
        </div>
      </section>

      ${renderTicker()}

      <section class="main-grid">
        <div class="content-column">
          <div class="section-heading">
            <div>
              <h2>${activeTag ? `#${escHtml(activeTag)}` : activeSearch ? '搜索结果' : '最新文章'}</h2>
              <p>${filtered.length} 篇可读档案</p>
            </div>
          </div>

          <div class="toolbar">
            ${renderSearch(activeSearch)}
            <div class="tag-row">${renderTagButtons(allTags, activeTag)}</div>
          </div>

          ${filtered.length ? `<ul class="article-list">${filtered.map(renderArticleCard).join('')}</ul>` : renderEmptyState()}
        </div>

        <aside class="side-column" aria-label="侧边信息">
          ${renderProfileWidget()}
          ${renderNowWidget()}
          ${renderNotesWidget()}
          ${renderTagWidget(allTags, activeTag)}
        </aside>
      </section>
    `

    bindHomeEvents()
    focusMain()
  }

  function renderTicker() {
    const items = [
      '前端札记',
      'AI 工具链',
      '界面实验',
      '碎碎念',
      '夜间调试',
      '静态博客',
      '月光相册',
      '星屑放映中'
    ]
    const spans = items.concat(items).map(item => `<span>${escHtml(item)}</span>`).join('')
    return `<div class="ticker-lane" aria-hidden="true"><div class="ticker-track">${spans}</div></div>`
  }

  function renderSearch(value) {
    return `
      <div class="search-wrap">
        <label class="search-label" for="search-input">搜索文章</label>
        <input class="search-input" id="search-input" type="search" value="${escAttr(value)}" placeholder="搜索标题、摘要或标签">
        <button class="search-clear${value ? ' visible' : ''}" id="search-clear" type="button" aria-label="清空搜索">×</button>
      </div>
    `
  }

  function renderTagButtons(tags, current) {
    const all = `<button class="tag${current ? '' : ' active'}" type="button" data-tag-clear="1">全部</button>`
    return all + tags.map(tag => (
      `<button class="tag${tag === current ? ' active' : ''}" type="button" data-tag="${escAttr(tag)}">#${escHtml(tag)}</button>`
    )).join('')
  }

  function renderArticleCard(post) {
    const slug = slugOf(post)
    const tags = post.tags.map(tag => `<button class="tag" type="button" data-tag="${escAttr(tag)}">#${escHtml(tag)}</button>`).join('')

    return `
      <li class="article-card" data-slug="${escAttr(slug)}" tabindex="0">
        <div class="cover-art" style="--cover-image: ${cssImage(post.cover)}"></div>
        <div class="article-content">
          <div class="article-meta">
            <span>${formatDate(post.date)}</span>
            <span>${escHtml(post.readTime)}</span>
            <span>${escHtml(post.mood)}</span>
          </div>
          <h3 class="article-title">${escHtml(post.title)}</h3>
          <p class="article-excerpt">${escHtml(post.excerpt)}</p>
          <div class="article-tags">${tags}</div>
        </div>
      </li>
    `
  }

  function renderProfileWidget() {
    return `
      <section class="profile-widget">
        <div class="profile-banner" aria-hidden="true"></div>
        <div class="profile-body">
          <div class="avatar" aria-hidden="true"></div>
          <h2>Plain Token</h2>
          <p>写工程实践、AI 工具和一些带着私心的界面实验。页面会随着视觉素材补齐继续生长。</p>
          <div class="profile-links">
            <a href="https://github.com/Torturedman" target="_blank" rel="noopener">GitHub</a>
            <a href="mailto:hi@plain-token.dev">Email</a>
          </div>
        </div>
      </section>
    `
  }

  function renderNowWidget() {
    return `
      <section class="side-widget">
        <h2>夜间电台</h2>
        <p>Now playing: A tiny song for refactoring</p>
        <div class="music-bar" aria-hidden="true"></div>
      </section>
    `
  }

  function renderNotesWidget() {
    return `
      <section class="side-widget">
        <h2>碎碎念</h2>
        <ul class="note-list">
          ${notes.map(note => `<li>${escHtml(note)}</li>`).join('')}
        </ul>
      </section>
    `
  }

  function renderTagWidget(tags, current) {
    return `
      <section class="side-widget">
        <h2>标签云</h2>
        <div class="tag-row">${renderTagButtons(tags, current)}</div>
      </section>
    `
  }

  function renderEmptyState() {
    return `
      <div class="empty-state">
        没有找到对应文章。换一个关键词或标签试试。
      </div>
    `
  }

  function renderPost(slug) {
    const post = posts.find(item => slugOf(item) === slug)
    if (!post) {
      render404()
      return
    }

    const tags = post.tags.map(tag => `<button class="tag" type="button" data-tag="${escAttr(tag)}">#${escHtml(tag)}</button>`).join('')

    mainContent.innerHTML = `
      <article class="post-page">
        <a class="back-link" href="#/">← 返回文章列表</a>

        <header class="post-cover" style="--cover-image: ${cssImage(post.cover)}">
          <div class="post-cover-content">
            <div class="article-meta">
              <span>${formatDate(post.date)}</span>
              <span>${escHtml(post.readTime)}</span>
              <span>${escHtml(post.mood)}</span>
            </div>
            <h1 class="post-title">${escHtml(post.title)}</h1>
            <p class="post-description">${escHtml(post.excerpt)}</p>
            <div class="article-tags">${tags}</div>
          </div>
        </header>

        <div class="post-layout">
          <nav class="toc" id="toc" aria-label="文章目录"></nav>
          <div class="article-body" id="article-body">${post.body}</div>
        </div>
      </article>
    `

    buildTOC()
    bindTagClicks()
    window.addEventListener('scroll', onTOCScroll, { passive: true })
    focusMain()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function renderAbout() {
    mainContent.innerHTML = `
      <section class="about-hero">
        <div class="about-copy">
          <p class="eyebrow">About Plain Token</p>
          <h1>一个轻二次元的个人博客壳</h1>
          <p>这次重做把原来的工程师暗色笔记改成了更有角色感的博客首页：透明面板、封面预留位、文章档案、碎碎念和标签云都放在首页首屏之后，读者进来能马上知道这里是一个个人创作空间。</p>
          <p>技术上仍然保持简单：纯 HTML、CSS、JavaScript 和 JSON 数据，不需要构建步骤，直接用静态托管就能跑。后面你只要替换文章数据和图片素材，就能继续扩展。</p>
          <ul class="about-list">
            <li>主页：大视觉、最新文章、搜索、标签筛选。</li>
            <li>文章页：封面、目录、正文排版、阅读进度。</li>
            <li>视觉素材：头像、主页背景、角色立绘、文章封面。</li>
          </ul>
        </div>

        ${renderProfileWidget()}
      </section>
    `
    focusMain()
  }

  function render404() {
    mainContent.innerHTML = `
      <div class="error-page">
        <div class="error-code">404</div>
        <p>这页还没有收录到星屑档案里。</p>
        <a class="primary-link" href="#/">回到首页</a>
      </div>
    `
    focusMain()
  }

  function bindHomeEvents() {
    document.querySelectorAll('.article-card').forEach(card => {
      card.addEventListener('click', event => {
        if (event.target.closest('[data-tag], [data-tag-clear]')) return
        location.hash = `#/post/${encodeURIComponent(card.dataset.slug)}`
      })
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
          location.hash = `#/post/${encodeURIComponent(card.dataset.slug)}`
        }
      })
    })

    bindTagClicks()
    bindSearch()
  }

  function bindTagClicks() {
    document.querySelectorAll('[data-tag]').forEach(button => {
      button.addEventListener('click', event => {
        event.stopPropagation()
        location.hash = `#/tag/${encodeURIComponent(button.dataset.tag)}`
      })
    })

    document.querySelectorAll('[data-tag-clear]').forEach(button => {
      button.addEventListener('click', event => {
        event.stopPropagation()
        location.hash = '#/'
      })
    })
  }

  function bindSearch() {
    const input = document.getElementById('search-input')
    const clear = document.getElementById('search-clear')
    if (!input) return

    let timer = 0
    input.addEventListener('input', () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        renderHome(activeTag, input.value.trim())
        const nextInput = document.getElementById('search-input')
        if (nextInput) {
          nextInput.focus()
          nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length)
        }
      }, 180)
    })

    if (clear) {
      clear.addEventListener('click', () => {
        renderHome(activeTag, '')
      })
    }
  }

  function buildTOC() {
    const toc = document.getElementById('toc')
    const headings = document.querySelectorAll('#article-body h2')
    if (!toc || headings.length < 2) {
      if (toc) toc.remove()
      return
    }

    const items = Array.from(headings).map((heading, index) => {
      const id = `section-${index + 1}`
      heading.id = id
      return `<li><a href="#${id}" data-toc-link>${escHtml(heading.textContent)}</a></li>`
    }).join('')

    toc.innerHTML = `<p class="toc-title">目录</p><ul>${items}</ul>`
  }

  function onTOCScroll() {
    const links = document.querySelectorAll('[data-toc-link]')
    const headings = document.querySelectorAll('#article-body h2[id]')
    if (!links.length || !headings.length) return

    let current = headings[0].id
    headings.forEach(heading => {
      if (heading.getBoundingClientRect().top < 130) current = heading.id
    })

    links.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`)
    })
  }

  function getFilteredPosts(tag, searchTerm) {
    const q = searchTerm.trim().toLowerCase()

    return posts.filter(post => {
      const tagMatch = !tag || post.tags.includes(tag)
      const searchMatch = !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some(item => item.toLowerCase().includes(q))
      return tagMatch && searchMatch
    })
  }

  function getAllTags() {
    const counts = new Map()
    posts.forEach(post => {
      post.tags.forEach(tag => counts.set(tag, (counts.get(tag) || 0) + 1))
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
      .map(([tag]) => tag)
  }

  function updateProgress() {
    if (!progressBar) return
    const max = document.documentElement.scrollHeight - window.innerHeight
    const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0
    progressBar.style.width = `${progress * 100}%`
  }

  function updateBackToTop() {
    if (!backToTop) return
    backToTop.classList.toggle('visible', window.scrollY > 420)
  }

  function onScroll() {
    updateProgress()
    updateBackToTop()
  }

  function initTheme() {
    const saved = localStorage.getItem('plain-token-theme')
    if (saved === 'night') {
      document.documentElement.setAttribute('data-theme', 'night')
      themeToggle.textContent = '昼'
    }

    themeToggle.addEventListener('click', () => {
      const night = document.documentElement.getAttribute('data-theme') === 'night'
      if (night) {
        document.documentElement.removeAttribute('data-theme')
        localStorage.setItem('plain-token-theme', 'day')
        themeToggle.textContent = '夜'
      } else {
        document.documentElement.setAttribute('data-theme', 'night')
        localStorage.setItem('plain-token-theme', 'night')
        themeToggle.textContent = '昼'
      }
    })
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  function slugOf(post) {
    return post.slug || post.id
  }

  function cssImage(path) {
    if (!path) return 'none'
    const safe = String(path).replace(/["'()\\\n\r]/g, '')
    return `url('${safe}')`
  }

  function escHtml(value) {
    const div = document.createElement('div')
    div.textContent = String(value ?? '')
    return div.innerHTML
  }

  function escAttr(value) {
    return escHtml(value).replace(/"/g, '&quot;')
  }

  function focusMain() {
    requestAnimationFrame(() => {
      mainContent.focus({ preventScroll: true })
    })
  }

  async function init() {
    initTheme()

    try {
      const response = await fetch('data/posts.json', { cache: 'no-store' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      posts = await response.json()
      posts.sort((a, b) => new Date(b.date) - new Date(a.date))
    } catch (error) {
      mainContent.innerHTML = `
        <div class="error-page">
          <div class="error-code">Data</div>
          <p>文章数据加载失败：${escHtml(error.message)}</p>
        </div>
      `
      return
    }

    dispatch()
    window.addEventListener('hashchange', dispatch)
    window.addEventListener('scroll', onScroll, { passive: true })
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
