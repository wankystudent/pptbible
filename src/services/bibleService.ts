/**
 * Bible Service to handle Bible searches using Bible SuperSearch API
 */

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

export interface BibleSearchResponse {
  book: string;
  chapter: number;
  verses: { number: number; text: string }[];
  language: string;
  source: string;
}

const API_URL = "https://api.biblesupersearch.com/api";

/**
 * Fetches Bible verses from Bible SuperSearch API
 * @param query The passage or search term (e.g., "John 3:16" or "faith")
 * @param translation The translation code (e.g., "hcv", "kjv", "lsg")
 * @returns A formatted BibleSearchResponse
 */
export async function fetchBiblePassage(query: string, translation: string = "hcv"): Promise<BibleSearchResponse> {
  const trimmedQuery = query.trim();
  
  // Detection logic based on user examples
  const hasNumbers = /\d/.test(trimmedQuery);
  const hasPunctuation = /[:;]/.test(trimmedQuery);
  
  let url = `${API_URL}?bible=${translation.toLowerCase()}`;

  // Case 1 & 2: Reference (has numbers or specific punctuation)
  // e.g., "Rom 4:1-10" or "Rom 1:1-2; Matt 5:6-8"
  if (hasNumbers || hasPunctuation) {
    url += `&reference=${encodeURIComponent(trimmedQuery)}`;
  } else {
    // Case 3 & 4: Search or Book + Search
    const parts = trimmedQuery.split(/\s+/);
    
    // Common Bible book abbreviations/names (short list for heuristic)
    const commonBooks = ['gen', 'exo', 'lev', 'num', 'deu', 'jos', 'jdg', 'rut', '1sa', '2sa', '1ki', '2ki', '1ch', '2ch', 'ezr', 'neh', 'est', 'job', 'psa', 'pro', 'ecc', 'sng', 'isa', 'jer', 'lam', 'ezk', 'dan', 'hos', 'jol', 'amo', 'oba', 'jon', 'mic', 'nam', 'hab', 'zep', 'hag', 'zec', 'mal', 'mat', 'mar', 'luk', 'joh', 'act', 'rom', '1co', '2co', 'gal', 'eph', 'phi', 'col', '1th', '2th', '1ti', '2ti', 'tit', 'phm', 'heb', 'jam', '1pe', '2pe', '1jo', '2jo', '3jo', 'jud', 'rev'];
    
    const firstWordLower = parts[0].toLowerCase();
    const isBook = commonBooks.some(b => firstWordLower.startsWith(b)) || parts[0].length > 15;

    if (parts.length > 1 && isBook) {
      // Case 4: 'Romans' searched 'for faith' -> reference=Rom&search=faith
      url += `&reference=${encodeURIComponent(parts[0])}&search=${encodeURIComponent(parts.slice(1).join(' '))}`;
    } else if (isBook && parts.length === 1) {
      // Just a book name -> reference=Rom
      url += `&reference=${encodeURIComponent(trimmedQuery)}`;
    } else {
      // Case 3: Search for 'faith' -> search=faith
      url += `&search=${encodeURIComponent(trimmedQuery)}`;
    }
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch from Bible SuperSearch API");
  }
  
  const data = await response.json();
  
  if (data.errors && data.errors.length > 0) {
    throw new Error(data.errors[0]);
  }
  
  // Handle Search Results vs Reference Results
  const verses: { number: number; text: string }[] = [];
  let bookName = "";
  let chapterNum = 0;

  if (data.results && data.results.verses) {
    // Reference Results
    const transKey = Object.keys(data.results.verses)[0];
    if (!transKey) throw new Error("Translation not found in results");
    
    const books = data.results.verses[transKey];
    const bookKeys = Object.keys(books);
    
    if (bookKeys.length > 1) {
      bookName = "Multiple Books";
    } else {
      bookName = bookKeys[0];
    }

    for (const book in books) {
      const chapters = books[book];
      const chapterKeys = Object.keys(chapters);
      
      if (bookKeys.length === 1 && chapterKeys.length > 1) {
        chapterNum = 0; // Multiple chapters in one book
        bookName = `${book} (Multiple Chapters)`;
      } else if (bookKeys.length === 1) {
        chapterNum = parseInt(chapterKeys[0]);
      }

      for (const chapter in chapters) {
        const verseData = chapters[chapter];
        for (const verse in verseData) {
          verses.push({
            number: parseInt(verse),
            text: bookKeys.length > 1 || chapterKeys.length > 1 
              ? `[${book} ${chapter}:${verse}] ${verseData[verse].text}`
              : verseData[verse].text
          });
        }
      }
    }
  } else if (data.results && data.results.search && data.results.search.results) {
    // Search Results
    const searchResults = data.results.search.results;
    if (searchResults.length === 0) throw new Error("No search results found");
    
    // Take the first few results to show
    searchResults.slice(0, 10).forEach((res: any) => {
      verses.push({
        number: res.verse,
        text: `[${res.book} ${res.chapter}:${res.verse}] ${res.text}`
      });
    });
    bookName = "Search Results";
  } else {
    throw new Error("No results found");
  }

  if (verses.length === 0) {
    throw new Error("No verses found in the response");
  }

  return {
    book: bookName,
    chapter: chapterNum,
    verses: verses.sort((a, b) => a.number - b.number),
    language: translation,
    source: "Bible SuperSearch"
  };
}
