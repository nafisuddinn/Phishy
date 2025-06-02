import { useEffect, useState } from 'react';

function ThreatFeed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; /*max number of rows per page*/
  const API_BASE = import.meta.env.VITE_API_URL;


  useEffect(() => {
    fetch(`${API_BASE}/feed`)
      .then(res => res.json())
      .then(data => {
        setFeed(data.feed || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load feed", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading community scam feed...</p>;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = feed.slice(startIndex, endIndex); /*slice only outputs the start index and ends before the stated end index*/

  const totalPages = Math.ceil(feed.length / itemsPerPage);


  return (
    <div className="feed">
      <h2>Community Scam Feed 🌐</h2>
      {feed.length === 0 ? (
        <p>No recent scam data available.</p>
      ) : (
        <>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Chance of Scam</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.timestamp).toLocaleString()}</td>
                  <td>{item.type}</td>
                  <td>{item.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>


              <div className="pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span> 
            <button
              onClick={() => setCurrentPage(prev => (endIndex < feed.length ? prev + 1 : prev))}
              disabled={currentPage === totalPages} /* Next button, disabled if on last page */
            >
              Next
            </button>
          </div>
        </>
    )}
    </div>
  );
}

export default ThreatFeed;
