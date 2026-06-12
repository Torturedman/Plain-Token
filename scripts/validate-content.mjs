import { existsSync, readFileSync } from 'fs'

const today = process.env.PLAIN_TOKEN_TODAY || localDateString(new Date())
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const posts = JSON.parse(readFileSync('data/posts.json', 'utf8'))
const errors = []

for (const post of posts) {
  const label = post.slug || post.id || post.title || '<untitled>'

  if (!datePattern.test(post.date || '')) {
    errors.push(`${label}: date must use YYYY-MM-DD, got ${JSON.stringify(post.date)}`)
  } else if (post.date > today) {
    errors.push(`${label}: date ${post.date} is after today ${today}`)
  }

  if (post.cover && !existsSync(post.cover)) {
    errors.push(`${label}: cover does not exist at ${post.cover}`)
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log(`Content validation passed for ${posts.length} posts through ${today}.`)

function localDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
