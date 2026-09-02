import './placeholder.css';

export default function Placeholder({ title, description }) {
  return (
    <div className="container placeholder">
      <h1 className="placeholder__title">{title}</h1>
      <p className="placeholder__body">{description}</p>
    </div>
  );
}
