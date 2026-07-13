// Vercel Serverless Function - Guestbook → Notion
// Database ID: 7721859915a040dda218054487217e8a

const NOTION_DATABASE_ID = '7721859915a040dda218054487217e8a';
const NOTION_API_URL = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

function notionHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_VERSION,
  };
}

export default async function handler(req, res) {
  const notionToken = process.env.NOTION_TOKEN;
  if (!notionToken) {
    return res.status(500).json({ message: 'Notion 연동 설정이 필요합니다.' });
  }

  // GET: 방명록 목록 조회
  if (req.method === 'GET') {
    try {
      const notionRes = await fetch(`${NOTION_API_URL}/databases/${NOTION_DATABASE_ID}/query`, {
        method: 'POST',
        headers: notionHeaders(notionToken),
        body: JSON.stringify({
          sorts: [{ property: '작성일시', direction: 'descending' }],
          page_size: 100,
        }),
      });

      if (!notionRes.ok) {
        const err = await notionRes.json();
        return res.status(500).json({ message: '불러오기 실패', detail: err.message });
      }

      const data = await notionRes.json();
      const entries = data.results.map(page => ({
        id: page.id,
        name: page.properties['이름']?.title?.[0]?.plain_text || '익명',
        message: page.properties['메시지']?.rich_text?.[0]?.plain_text || '',
        createdAt: page.properties['작성일시']?.created_time || '',
      }));

      return res.status(200).json({ entries });
    } catch (err) {
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }

  // POST: 방명록 등록
  if (req.method === 'POST') {
    const { name, message, password } = req.body;

    if (!name || !message) {
      return res.status(400).json({ message: '이름과 메시지는 필수입니다.' });
    }
    if (message.length > 200) {
      return res.status(400).json({ message: '메시지는 200자 이내로 입력해주세요.' });
    }

    try {
      const notionRes = await fetch(`${NOTION_API_URL}/pages`, {
        method: 'POST',
        headers: notionHeaders(notionToken),
        body: JSON.stringify({
          parent: { database_id: NOTION_DATABASE_ID },
          properties: {
            이름: { title: [{ text: { content: name } }] },
            메시지: { rich_text: [{ text: { content: message } }] },
            비밀번호: { rich_text: password ? [{ text: { content: password } }] : [] },
          },
        }),
      });

      if (!notionRes.ok) {
        const err = await notionRes.json();
        return res.status(500).json({ message: '저장 실패', detail: err.message });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }

  // DELETE: 비밀번호 확인 후 삭제
  if (req.method === 'DELETE') {
    const { id, password } = req.body;

    if (!id || !password) {
      return res.status(400).json({ message: '필수 값이 없습니다.' });
    }

    try {
      // 해당 페이지 조회해서 비밀번호 확인
      const pageRes = await fetch(`${NOTION_API_URL}/pages/${id}`, {
        headers: notionHeaders(notionToken),
      });

      if (!pageRes.ok) {
        return res.status(404).json({ message: '메시지를 찾을 수 없습니다.' });
      }

      const page = await pageRes.json();
      const stored = page.properties['비밀번호']?.rich_text?.[0]?.plain_text || '';

      if (stored !== password) {
        return res.status(403).json({ message: '비밀번호가 맞지 않습니다.' });
      }

      // 비밀번호 일치 → 페이지 삭제(archive)
      const delRes = await fetch(`${NOTION_API_URL}/pages/${id}`, {
        method: 'PATCH',
        headers: notionHeaders(notionToken),
        body: JSON.stringify({ archived: true }),
      });

      if (!delRes.ok) {
        return res.status(500).json({ message: '삭제 실패' });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
