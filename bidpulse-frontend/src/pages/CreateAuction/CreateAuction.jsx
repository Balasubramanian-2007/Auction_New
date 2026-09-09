import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAuction } from '../../api/auctions';
import './createauction.css';

const initialForm = {
  title: '',
  description: '',
  starting_price: '',
  auction_type: 'PUB',
  start_time: '',
  end_time: '',
};

export default function CreateAuction() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [photo, setPhoto] = useState(null);
  const [video, setVideo] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!photo) {
      setError('A photo of the item is required.');
      return;
    }
    if (!form.start_time || !form.end_time) {
      setError('Please set a start and end time.');
      return;
    }
    if (new Date(form.start_time) >= new Date(form.end_time)) {
      setError('Start time must be before end time.');
      return;
    }

    setSubmitting(true);
    try {
      // NOTE: photo/video are collected and previewed here, but not yet sent to
      // the backend — `auction` has no image_url/video_url columns yet. Once
      // cloud storage is wired up, this is where the upload + URL submission goes.
      const { data } = await createAuction({
        title: form.title,
        description: form.description,
        starting_price: Number(form.starting_price),
        auction_type: form.auction_type,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
      });

      if (data.message === 'Auction scheduled successfully') {
        navigate('/my-auctions');
      } else {
        setError(data.message || 'Could not create the auction.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page container create-auction">
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Sell an item</h1>
          <p className="page-header__subtitle">Set the details, the schedule, and open the floor.</p>
        </div>
      </div>

      {error && <div className="state-banner state-banner--error">{error}</div>}

      <form className="auth-form create-auction__form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" required value={form.title} onChange={update('title')} placeholder="What's the lot?" />
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" required value={form.description} onChange={update('description')} placeholder="Condition, provenance, anything a bidder should know" />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="starting_price">Starting price ($)</label>
            <input id="starting_price" type="number" min="1" required value={form.starting_price} onChange={update('starting_price')} />
          </div>
          <div className="field">
            <label>Visibility</label>
            <div className="radio-row">
              <label className="radio-option">
                <input type="radio" name="auction_type" value="PUB" checked={form.auction_type === 'PUB'} onChange={update('auction_type')} />
                Public
              </label>
              <label className="radio-option">
                <input type="radio" name="auction_type" value="PVT" checked={form.auction_type === 'PVT'} onChange={update('auction_type')} />
                Private (approve buyers)
              </label>
            </div>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="start_time">Starts</label>
            <input id="start_time" type="datetime-local" required value={form.start_time} onChange={update('start_time')} />
          </div>
          <div className="field">
            <label htmlFor="end_time">Ends</label>
            <input id="end_time" type="datetime-local" required value={form.end_time} onChange={update('end_time')} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Photo (required)</label>
            <label className="file-drop">
              <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
              <span className="file-drop__label">{photo ? photo.name : 'Click to choose a photo'}</span>
              {photo && <div className="file-drop__preview">Selected</div>}
            </label>
          </div>
          <div className="field">
            <label>Video (optional)</label>
            <label className="file-drop">
              <input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files?.[0] || null)} />
              <span className="file-drop__label">{video ? video.name : 'Click to choose a video'}</span>
              {video && <div className="file-drop__preview">Selected</div>}
            </label>
          </div>
        </div>
        <p className="field-hint">Media upload isn't connected to storage yet - it's captured here so the form is ready once that's wired up.</p>

        <button className="btn btn--primary auth-submit" type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create auction'}
        </button>
      </form>
    </div>
  );
}
