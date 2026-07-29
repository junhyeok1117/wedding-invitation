// Vercel Serverless Function - RSVP → Notion
// Database ID: c01e92c4-9416-49ca-bb1d-9dffbdb2cccb

const NOTION_DATABASE_ID = 'c01e92c4941649cabb1d9dffbdb2cccb';
const NOTION_API_URL = 'https://api.notion.com/v1/pages';
const NOTION_VERSION = '2022-06-28';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, attendance, guestCount, companions, childSeatCount, phone, requests } = req.body;

  if (!name || !attendance) {
    return res.status(400).json({ message: '이름과 참석 여부는 필수입니다.' });
  }

  const notionToken = process.env.NOTION_TOKEN;
  if (!notionToken) {
    return res.status(500).json({ message: 'Notion 연동 설정이 필요합니다.' });
  }

  const body = {
    parent: { database_id: NOTION_DATABASE_ID },
    properties: {
      이름: {
        title: [{ text: { content: name } }],
      },
      '참석 여부': {
        select: { name: attendance },
      },
      인원수: {
        number: guestCount || 1,
      },
      동반인: {
        rich_text: companions ? [{ text: { content: companions } }] : [],
      },
      '자녀좌석인원': {
        number: childSeatCount || 0,
      },
      연락처: {
        phone_number: phone || null,
      },
      요청사항: {
        rich_text: requests ? [{ text: { content: requests } }] : [],
      },
    },
  };

  try {
    const notionRes = await fetch(NOTION_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': NOTION_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!notionRes.ok) {
      const errData = await notionRes.json();
      console.error('Notion API error:', errData);
      return res.status(500).json({ message: 'Notion 저장 실패', detail: errData.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}
