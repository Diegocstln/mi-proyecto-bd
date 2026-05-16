export function initComunidad({ books }) {
  const rankingList = document.querySelector("#rankingList");

  rankingList.innerHTML = [...books]
    .sort((first, second) => second.rating - first.rating)
    .slice(0, 5)
    .map((book) => `<li><strong>${book.title}</strong><br><span>${book.author} - ${book.rating}/5</span></li>`)
    .join("");
}
