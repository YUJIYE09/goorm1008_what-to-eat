// 투표 결과 화면: 식당별 득표수 막대, 순위, 1위(공동 1위) 표시
import { getVote, getResponses } from '../services/storage.js';
import { restaurants } from '../data/restaurants.js';
import { escapeHtml, formatDeadline } from '../utils/format.js';

// 투표 집계: 후보마다 표 수와 투표한 사람을 모아서, 많이 받은 순으로 정렬해요
export function tallyVotes(vote, responses) {
  const rows = vote.candidates
    .map((id) => restaurants.find((r) => r.id === id))
    .filter(Boolean)
    .map((restaurant) => {
      const voters = responses
        .filter((response) => response.restaurantId === restaurant.id)
        .map((response) => response.voterName);
      return { restaurant, count: voters.length, voters };
    });

  // 표가 많은 순 (같으면 원래 후보 순서 유지)
  return rows.sort((a, b) => b.count - a.count);
}

export function Results(params) {
  const vote = getVote(params.id);

  if (!vote) {
    return `
      <section class="page empty">
        <h1 class="page__title">투표를 찾을 수 없어요</h1>
        <a href="#/candidates" class="btn btn--primary">후보 화면으로</a>
      </section>
    `;
  }

  const responses = getResponses(vote.id);
  const rows = tallyVotes(vote, responses);
  const total = responses.length;
  const topCount = rows[0]?.count ?? 0;
  const winners = rows.filter((row) => row.count === topCount && topCount > 0);
  const closed = new Date(vote.deadline) <= new Date();

  const bars = rows
    .map((row) => {
      // 막대 길이: 1위를 100%로 두고 나머지를 비율로
      const width = topCount > 0 ? Math.round((row.count / topCount) * 100) : 0;
      const isWinner = winners.includes(row);
      return `
        <li class="result ${isWinner ? 'result--winner' : ''}">
          <div class="result__head">
            <span class="result__name">${isWinner ? '🏆 ' : ''}${row.restaurant.name}</span>
            <span class="result__count">${row.count}표</span>
          </div>
          <div class="result__track" role="img"
            aria-label="${row.restaurant.name} ${row.count}표, 전체 ${total}표 중">
            <div class="result__bar" style="width: ${width}%"></div>
          </div>
          ${
            row.voters.length > 0
              ? `<p class="result__voters">${row.voters.map(escapeHtml).join(', ')}</p>`
              : ''
          }
        </li>`;
    })
    .join('');

  let winnerBox;
  if (total === 0) {
    winnerBox = `<div class="winner winner--empty"><p>아직 투표한 사람이 없어요.</p></div>`;
  } else if (winners.length > 1) {
    winnerBox = `
      <div class="winner">
        <p class="winner__label">🏆 공동 1위입니다!</p>
        <p class="winner__name">${winners.map((w) => w.restaurant.name).join(' · ')}</p>
        <p class="winner__desc">각각 ${topCount}표씩 받았어요.</p>
      </div>`;
  } else {
    winnerBox = `
      <div class="winner">
        <p class="winner__label">🏆 ${closed ? '최종 1위' : '현재 1위'}</p>
        <p class="winner__name">${winners[0].restaurant.name}</p>
        <p class="winner__desc">${winners[0].restaurant.address}</p>
      </div>`;
  }

  return `
    <section class="page">
      <h1 class="page__title"><span aria-hidden="true">🎉</span> 투표 결과</h1>
      <p class="page__desc">
        ${escapeHtml(vote.title)} · 총 ${total}명 참여 ·
        ${closed ? '마감됨' : `마감 ${formatDeadline(vote.deadline)}`}
      </p>

      ${winnerBox}

      <ol class="result-list">${bars}</ol>

      <div class="page__actions success__actions">
        ${closed ? '' : `<a href="#/vote?id=${vote.id}" class="btn btn--secondary">투표하러 가기</a>`}
        <a href="#/create" class="btn btn--secondary">+ 새 모임 만들기</a>
      </div>
    </section>
  `;
}
