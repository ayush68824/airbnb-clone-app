import { useEffect, useRef } from "react";
import { asset, gallery, hero, rooms, TITLE } from "./data";
import { IconChevron, IconClose, IconGrid, IconHeart, IconUpload } from "./icons";

function rowsFor(photos) {
  const rows = [];
  let index = 0;
  while (index < photos.length) {
    rows.push({ kind: "wide", items: [photos[index]] });
    index += 1;
    if (index >= photos.length) break;
    if (index + 1 < photos.length) {
      rows.push({ kind: "pair", items: [photos[index], photos[index + 1]] });
      index += 2;
    } else {
      rows.push({ kind: "wide", items: [photos[index]] });
      index += 1;
    }
  }
  return rows;
}

export function PhotoGrid({ onOpen }) {
  return (
    <section className="mosaic" aria-label="Photos of this place" id="photos">
      {hero.map((file, index) => (
        <button
          key={file}
          className={index === 0 ? "tile big" : "tile"}
          type="button"
          aria-label={`${TITLE} image ${index + 1}`}
          onClick={() => onOpen(0)}
        >
          <img src={asset(file)} alt="" />
        </button>
      ))}
      <button className="show-all" type="button" onClick={() => onOpen(0)}>
        <IconGrid />
        Show all photos
      </button>
    </section>
  );
}

export function PhotoTour({ onClose, onOpenPhoto, saved, onSave, onShare, startRoom = null }) {
  const root = useRef(null);
  const offsets = [];
  let cursor = 0;
  rooms.forEach((room) => {
    offsets.push(cursor);
    cursor += room.photos.length;
  });

  useEffect(() => {
    const node = root.current;
    const close = node.querySelector("[data-autofocus]");
    close?.focus();
    if (startRoom) document.getElementById(startRoom)?.scrollIntoView({ block: "start" });
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, startRoom]);

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label="Photo tour" ref={root}>
      <div className="tour-bar">
        <button className="icon-circle" type="button" aria-label="Back" data-autofocus onClick={onClose}>
          <IconChevron dir="left" />
        </button>
        <h2>Photo tour</h2>
        <div style={{ display: "flex" }}>
          <button className="icon-circle" type="button" aria-label="Share" onClick={onShare}>
            <IconUpload />
          </button>
          <button className="icon-circle" type="button" aria-label="Save" aria-pressed={saved} onClick={onSave}>
            <IconHeart filled={saved} />
          </button>
        </div>
      </div>
      <nav className="cats" aria-label="Photo categories">
        {rooms.map((room) => (
          <button
            key={room.id}
            className="cat"
            type="button"
            onClick={() => document.getElementById(room.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            <img src={asset(room.photos[0])} alt="" />
            <span>{room.name}</span>
          </button>
        ))}
      </nav>
      {rooms.map((room, roomIndex) => (
        <section className="room" id={room.id} key={room.id}>
          <div className="room-copy">
            <h3>{room.name}</h3>
            {room.features.length > 0 && <p>{room.features.join("  ·  ")}</p>}
          </div>
          <div className="room-photos">
            {rowsFor(room.photos).map((row, rowIndex) =>
              row.kind === "pair" ? (
                <div className="pair" key={rowIndex}>
                  {row.items.map((file) => {
                    const globalIndex = offsets[roomIndex] + room.photos.indexOf(file);
                    return (
                      <button
                        key={file}
                        className="shot half"
                        type="button"
                        aria-label={`${TITLE} image ${globalIndex + 1}`}
                        onClick={() => onOpenPhoto(globalIndex)}
                      >
                        <img src={asset(file)} alt={room.name} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                row.items.map((file) => {
                  const globalIndex = offsets[roomIndex] + room.photos.indexOf(file);
                  return (
                    <button
                      key={file}
                      className="shot wide"
                      type="button"
                      aria-label={`${TITLE} image ${globalIndex + 1}`}
                      onClick={() => onOpenPhoto(globalIndex)}
                    >
                      <img src={asset(file)} alt={room.name} />
                    </button>
                  );
                })
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

export function Lightbox({ index, direction, onClose, onBackToTour, onChange }) {
  const photo = gallery[index];
  const root = useRef(null);

  useEffect(() => {
    root.current?.querySelector("[data-autofocus]")?.focus();
    function onKey(event) {
      if (event.key === "Escape") onBackToTour();
      if (event.key === "ArrowRight" && index < gallery.length - 1) onChange(index + 1, "next");
      if (event.key === "ArrowLeft" && index > 0) onChange(index - 1, "prev");
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, onBackToTour, onChange, onClose]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" ref={root}>
      <div className="lb-top">
        <button className="icon-circle" type="button" aria-label="Show all photos" onClick={onBackToTour}>
          <IconGrid />
        </button>
        <button className="icon-circle" type="button" aria-label="Close" data-autofocus onClick={onClose}>
          <IconClose />
        </button>
      </div>
      <button
        className="lb-arrow prev"
        type="button"
        aria-label="Previous"
        disabled={index === 0}
        onClick={() => onChange(index - 1, "prev")}
      >
        <IconChevron dir="left" />
      </button>
      <button
        className="lb-arrow next"
        type="button"
        aria-label="Next"
        disabled={index === gallery.length - 1}
        onClick={() => onChange(index + 1, "next")}
      >
        <IconChevron dir="right" />
      </button>
      <div className={direction === "prev" ? "lb-stage from-left" : "lb-stage"}>
        <img key={photo.file + direction} src={asset(photo.file)} alt={`${TITLE} image ${index + 1}`} />
        <div className="lb-cap">
          <strong>{photo.room}</strong>
          <span>
            {index + 1} of {gallery.length}
          </span>
        </div>
      </div>
      <p className="sr" aria-live="polite">
        {photo.room}, photo {index + 1} of {gallery.length}
      </p>
    </div>
  );
}
