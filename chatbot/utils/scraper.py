import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

def scrape_entire_website(base_url, max_pages=20):
    visited = set()
    to_visit = [base_url]
    pages = []

    while to_visit and len(visited) < max_pages:
        url = to_visit.pop()
        if url in visited:
            continue
        visited.add(url)

        try:
            response = requests.get(url, timeout=5)
            soup = BeautifulSoup(response.text, 'html.parser')

            for tag in soup(["script", "style", "noscript"]):
                tag.decompose()

            text = soup.get_text(separator=' ', strip=True)
            pages.append((url, text))

            for link in soup.find_all('a', href=True):
                full_url = urljoin(url, link['href'])
                if urlparse(full_url).netloc == urlparse(base_url).netloc:
                    to_visit.append(full_url)

        except Exception:
            continue

    return pages  # List of (url, text)
