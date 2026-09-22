import { useEffect, useRef, useState } from "react";
import {
  amenityGroups,
  asset,
  chips,
  cohosts,
  dayBefore,
  description,
  formatLong,
  formatShort,
  formatSlash,
  highlights,
  histogram,
  inr,
  MAX_GUESTS,
  nearby,
  neighbourhood,
  nightsBetween,
  NIGHTLY,
  previewAmenities,
  reviews,
  sameDay,
  scores,
  strip,
  TITLE,
} from "./data";
import {
  AmenityIcon,
  HighlightIcon,
  IconChevron,
  IconClose,
  IconGlobe,
  IconHeart,
  IconMenu,
  IconSearch,
  IconStar,
  IconUpload,
  Logo,
  MapArt,
  Wordmark,
} from "./icons";
import { Lightbox, PhotoGrid, PhotoTour } from "./photos";

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];
const TODAY = strip(new Date(2026, 8, 22));

function monthCells(year, month) {
  const first = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: first }, () => null);
  for (let day = 1; day <= count; day += 1) cells.push(new Date(year, month, day));
  while (cells.length % 7) cells.push(null);
  return cells;
}

function guestLabel(adults, children, infants, pets) {
  const guests = adults + children;
  const parts = [`${guests} guest${guests === 1 ? "" : "s"}`];
  if (infants) parts.push(`${infants} infant${infants === 1 ? "" : "s"}`);
  if (pets) parts.push(`${pets} pet${pets === 1 ? "" : "s"}`);
  return parts.join(", ");
}

function Dialog({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    const previous = document.activeElement;
    node.querySelector("[data-autofocus]")?.focus();
    function onKey(event) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const items = [...node.querySelectorAll("button, a, input, textarea")].filter((el) => !el.disabled);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        style={wide ? { width: "min(880px, calc(100% - 48px))" } : undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <button className="icon-circle" type="button" aria-label="Close" data-autofocus onClick={onClose}>
            <IconClose />
          </button>
          <h2>{title}</h2>
          <span style={{ width: 40 }} />
        </header>
        <div className="body">{children}</div>
      </div>
    </div>
  );
}

function Calendar({ checkIn, checkOut, hover, onPick, onHover, month, setMonth }) {
  const left = month;
  const right = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const months = [left, right];

  return (
    <div id="stay-calendar">
      <div className="calendar-head">
        <div>
          <h2 className="section-h" style={{ marginBottom: 0 }}>
            {checkIn && checkOut ? `${nightsBetween(checkIn, checkOut)} nights in Candolim` : "Select check-in date"}
          </h2>
          <p>{checkIn && checkOut ? `${formatShort(checkIn)} - ${formatShort(checkOut)}` : "Add your travel dates for exact pricing"}</p>
        </div>
        <div className="cal-nav">
          <button className="icon-circle" type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
            <IconChevron dir="left" />
          </button>
          <button className="icon-circle" type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
            <IconChevron dir="right" />
          </button>
        </div>
      </div>
      <div className="months">
        {months.map((current) => (
          <div key={current.toISOString()}>
            <div className="month-label">
              {current.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
            <div className="dow">
              {WEEK.map((label, index) => (
                <span key={`${current.getMonth()}-${label}-${index}`}>{label}</span>
              ))}
            </div>
            <div className="days">
              {monthCells(current.getFullYear(), current.getMonth()).map((date, index) => {
                if (!date) return <span key={`e-${index}`} />;
                const disabled = date < TODAY;
                const start = sameDay(date, checkIn);
                const end = sameDay(date, checkOut);
                const rangeEnd = checkOut || (hover && checkIn && hover > checkIn ? hover : null);
                const inRange = Boolean(checkIn && rangeEnd && date > checkIn && date < rangeEnd);
                const className = [
                  "day",
                  start ? "start" : "",
                  end || (rangeEnd && !checkOut && sameDay(date, rangeEnd)) ? "end" : "",
                  inRange ? "in-range" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    className={className}
                    disabled={disabled}
                    onClick={() => onPick(date)}
                    onMouseEnter={() => onHover(date)}
                    aria-label={date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    aria-pressed={start || end}
                  >
                    <span className="num">{date.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [tour, setTour] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [direction, setDirection] = useState("next");
  const [saved, setSaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menu, setMenu] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [original, setOriginal] = useState(false);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [chip, setChip] = useState(null);
  const [howOpen, setHowOpen] = useState(false);
  const [checkIn, setCheckIn] = useState(new Date(2026, 9, 18));
  const [checkOut, setCheckOut] = useState(new Date(2026, 9, 23));
  const [hover, setHover] = useState(null);
  const [month, setMonth] = useState(new Date(2026, 9, 1));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [pets, setPets] = useState(0);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [auth, setAuth] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [areaSearch, setAreaSearch] = useState(false);
  const [hoodOpen, setHoodOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [policy, setPolicy] = useState(null);
  const [page, setPage] = useState(0);
  const [stuck, setStuck] = useState(false);
  const [active, setActive] = useState("photos");
  const [sleepRoom, setSleepRoom] = useState(null);

  const nights = nightsBetween(checkIn, checkOut);
  const total = nights * NIGHTLY;
  const due = claimed ? total * 0.9 : total;
  const guests = guestLabel(adults, children, infants, pets);

  useEffect(() => {
    function sync() {
      const params = new URLSearchParams(window.location.search);
      const modal = params.get("modal");
      const item = params.get("modalItem");
      setTour(modal === "PHOTO_TOUR_SCROLLABLE");
      setPhoto(item != null ? Number(item) - 1000 : null);
    }
    window.addEventListener("popstate", sync);
    sync();
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    document.body.style.overflow = tour || photo != null || sleepRoom || amenitiesOpen || reviewsOpen || reserveOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [tour, photo, sleepRoom, amenitiesOpen, reviewsOpen, reserveOpen]);

  useEffect(() => {
    if (!menu && !guestsOpen && !areaSearch) return;
    function onDown(event) {
      const target = event.target;
      if (menu && !target.closest(".globe-wrap, .menu-wrap")) setMenu(null);
      if (guestsOpen && !target.closest(".guest-anchor, .guest-field")) setGuestsOpen(false);
      if (areaSearch && !target.closest(".map-wrap")) setAreaSearch(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menu, guestsOpen, areaSearch]);

  useEffect(() => {
    function onScroll() {
      setStuck(window.scrollY > 80);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const sections = ["photos", "amenities", "reviews", "location"].map((id) => document.getElementById(id));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px" },
    );
    sections.forEach((node) => node && observer.observe(node));
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  function go(modal, item) {
    const url = new URL(window.location.href);
    if (modal) url.searchParams.set("modal", modal);
    else url.searchParams.delete("modal");
    if (item != null) url.searchParams.set("modalItem", String(1000 + item));
    else url.searchParams.delete("modalItem");
    window.history.pushState({}, "", url);
    setTour(Boolean(modal));
    setPhoto(item ?? null);
  }

  function pickDate(date) {
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(date);
      setCheckOut(null);
      return;
    }
    if (date <= checkIn) {
      setCheckIn(date);
      setCheckOut(null);
      return;
    }
    setCheckOut(date);
  }

  function changeGuests(key, delta) {
    const next = { adults, children, infants, pets, [key]: { adults, children, infants, pets }[key] + delta };
    if (next.adults < 1) return;
    if (next.adults + next.children > MAX_GUESTS) return;
    if (next.infants < 0 || next.pets < 0 || next.children < 0) return;
    if (next.infants > 5 || next.pets > 2) return;
    setAdults(next.adults);
    setChildren(next.children);
    setInfants(next.infants);
    setPets(next.pets);
  }

  async function copyLink() {
    const link = window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const filteredReviews = chip
    ? reviews.filter((review) => review.text.toLowerCase().includes(chip.toLowerCase()))
    : reviews;

  const cancelDay = checkIn ? dayBefore(checkIn) : null;
  const overlay = tour || photo != null || sleepRoom || amenitiesOpen || reviewsOpen || reserveOpen || termsOpen || reportOpen || auth || messageOpen || policy;

  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="header" inert={overlay ? true : undefined}>
        <div className="header-inner">
          <a className="home-link" href="/" aria-label="Airbnb homepage">
            <Wordmark />
          </a>
          <div className="search-pill" role="group" aria-label="Search">
            <button className="search-seg" type="button" onClick={() => setSearchOpen((open) => !open)}>
              <img src={asset("ui/searchbar-house.png")} alt="" />
              Anywhere
            </button>
            <span className="search-div" />
            <button className="search-seg" type="button" onClick={() => setSearchOpen((open) => !open)}>
              Anytime
            </button>
            <span className="search-div" />
            <button className="search-seg quiet" type="button" onClick={() => setSearchOpen((open) => !open)}>
              Add guests
            </button>
            <button className="search-go" type="button" aria-label="Search" onClick={() => setSearchOpen(true)}>
              <IconSearch />
            </button>
          </div>
          <nav className="header-nav">
          <a className="host-link" href="#host">
            Become a host
          </a>
          <div className="globe-wrap">
            <button className="icon-circle" type="button" aria-label="Choose a language and currency" aria-expanded={menu === "globe"} onClick={() => setMenu(menu === "globe" ? null : "globe")}>
              <IconGlobe />
            </button>
            {menu === "globe" && (
              <div className="popover" role="menu">
                <button type="button" role="menuitem" onClick={() => setMenu(null)}>
                  English
                </button>
                <button type="button" role="menuitem" onClick={() => setMenu(null)}>
                  Indian rupee · INR
                </button>
              </div>
            )}
          </div>
          <div className="menu-wrap">
            <button className="menu-btn" type="button" aria-label="Main navigation menu" aria-expanded={menu === "main"} onClick={() => setMenu(menu === "main" ? null : "main")}>
              <IconMenu />
            </button>
            {menu === "main" && (
              <div className="popover" role="menu">
                <button type="button" role="menuitem" onClick={() => { setAuth("Sign up"); setMenu(null); }}>
                  Sign up
                </button>
                <button type="button" role="menuitem" onClick={() => { setAuth("Log in"); setMenu(null); }}>
                  Log in
                </button>
                <a role="menuitem" href="#host" onClick={() => setMenu(null)}>
                  Become a host
                </a>
                <button type="button" role="menuitem" onClick={() => setMenu(null)}>
                  Help Centre
                </button>
              </div>
            )}
          </div>
          </nav>
        </div>
        {searchOpen && (
          <form
            className="search-panel"
            onSubmit={(event) => {
              event.preventDefault();
              setSearchOpen(false);
            }}
          >
            <label htmlFor="where">Where</label>
            <input id="where" defaultValue="Candolim, Goa" />
            <label htmlFor="when">When</label>
            <input id="when" defaultValue={checkIn && checkOut ? `${formatShort(checkIn)} – ${formatShort(checkOut)}` : "Anytime"} />
            <label htmlFor="who">Who</label>
            <input id="who" defaultValue={guests} />
            <button className="reserve" type="submit">
              Search
            </button>
          </form>
        )}
      </header>

      <div className={stuck ? "sticky-bar show" : "sticky-bar"} inert={stuck ? undefined : true} aria-hidden={stuck ? undefined : true}>
        <div className="sticky-inner">
          <nav className="section-nav" aria-label="Listing sections">
            {["photos", "amenities", "reviews", "location"].map((id) => (
              <a key={id} href={`#${id}`} className={active === id ? "active" : ""}>
                {id[0].toUpperCase() + id.slice(1)}
              </a>
            ))}
          </nav>
          <div className="sticky-reserve">
            <div>
              <div className="sticky-price">
                {nights ? (
                  <>
                    <strong>{inr(due)}</strong> for {nights} nights
                  </>
                ) : (
                  "Add dates for prices"
                )}
              </div>
              <div className="sticky-meta">
                <IconStar /> 4.95 · {reviews.length} reviews
              </div>
            </div>
            <button className="reserve-sm" type="button" onClick={() => nights && setReserveOpen(true)} disabled={!nights}>
              Reserve
            </button>
          </div>
        </div>
      </div>

      <main id="content" inert={overlay ? true : undefined}>
        <div className="wrap">
          <div className="title-row">
            <h1>{TITLE}</h1>
            <div className="title-actions">
              <button className="text-btn" type="button" onClick={() => { setShareOpen((open) => !open); setCopied(false); }}>
                <IconUpload /> Share
              </button>
              <button className="text-btn" type="button" aria-pressed={saved} onClick={() => setSaved((value) => !value)}>
                <IconHeart filled={saved} /> Save
              </button>
              {shareOpen && (
                <div className="popover share-pop">
                  <button type="button" onClick={copyLink}>
                    {copied ? "Link copied" : "Copy link"}
                  </button>
                  <a href={`mailto:?subject=${encodeURIComponent(TITLE)}&body=${encodeURIComponent(window.location.href)}`}>Email</a>
                  <button type="button" onClick={() => setShareOpen(false)}>
                    Messages
                  </button>
                </div>
              )}
            </div>
          </div>

          <PhotoGrid onOpen={() => go("PHOTO_TOUR_SCROLLABLE", null)} />

          <div className="split">
            <div>
              <h2 className="place-title">Entire serviced apartment in Candolim, India</h2>
              <p className="place-sub">3 guests · 1 bedroom · 1 bed · 1 bathroom</p>
              <div className="favourite">
                <div className="fav-copy">
                  <img src={asset("ui/laurel-left.png")} alt="" />
                  <div>
                    <strong>Guest favourite</strong>
                    <p>One of the most loved homes on Airbnb, according to guests</p>
                  </div>
                  <img src={asset("ui/laurel-right.png")} alt="" />
                </div>
                <button className="fav-stat" type="button" onClick={() => document.getElementById("reviews")?.scrollIntoView()}>
                  <b>4.95</b>
                  <span> </span>
                </button>
                <button className="fav-stat" type="button" onClick={() => document.getElementById("reviews")?.scrollIntoView()}>
                  <b>{reviews.length}</b>
                  <span>Reviews</span>
                </button>
              </div>
              <hr className="rule" />
              <div className="host-row">
                <img src={asset("avatars/host.jpeg")} alt="" />
                <div>
                  <strong>Hosted by Mirashya Homes</strong>
                  <span>2 years hosting</span>
                </div>
              </div>
              <hr className="rule" />
              {highlights.map((item) => (
                <div className="highlight" key={item.title}>
                  <HighlightIcon name={item.icon} />
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </div>
              ))}
              <hr className="rule" />
              <p className="translate">
                Some info has been automatically translated.{" "}
                <button type="button" onClick={() => setOriginal((value) => !value)}>
                  {original ? "Translate" : "Show original"}
                </button>
              </p>
              <p className={descOpen ? "description" : "description clamp"}>{description}</p>
              {!descOpen && (
                <button className="more" type="button" onClick={() => setDescOpen(true)}>
                  Show more <IconChevron dir="right" />
                </button>
              )}
              <hr className="rule" />
              <h2 className="section-h">Where you'll sleep</h2>
              <div className="sleep-row">
                <button className="sleep-card" type="button" onClick={() => setSleepRoom("bedroom")}>
                  <img src={asset("67c61c6f-6260-4809-9510-0360e58a345d.jpeg")} alt="Bedroom" />
                  <strong>Bedroom</strong>
                  <span>1 double bed</span>
                </button>
                <button className="sleep-card" type="button" onClick={() => setSleepRoom("living-1")}>
                  <img src={asset("a9831aeb-f441-44f5-a38f-4cf54e3f0fcf.jpeg")} alt="Living room" />
                  <strong>Living room</strong>
                  <span>1 sofa</span>
                </button>
              </div>
              <hr className="rule" />
              <h2 className="section-h" id="amenities">
                What this place offers
              </h2>
              <div className="amenity-grid">
                {previewAmenities.map((name) => (
                  <div className="amenity" key={name}>
                    <AmenityIcon name={name} />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
              <button className="outline-btn" type="button" onClick={() => setAmenitiesOpen(true)}>
                Show all 50 amenities
              </button>
              <hr className="rule" />
              <Calendar
                checkIn={checkIn}
                checkOut={checkOut}
                hover={hover}
                onPick={pickDate}
                onHover={setHover}
                month={month}
                setMonth={setMonth}
              />
              {(checkIn || checkOut) && (
                <button
                  className="clear-dates"
                  type="button"
                  onClick={() => {
                    setCheckIn(null);
                    setCheckOut(null);
                  }}
                >
                  Clear dates
                </button>
              )}
            </div>

            <aside className="booking-col">
              <div className="deal">
                <img src={asset("ui/discount.svg")} alt="" />
                <div>
                  <p>{claimed ? "10% off applied to this stay." : "Get 10% off your next stay."}</p>
                  <button className="linkish" type="button" onClick={() => setTermsOpen(true)} style={{ background: "none", border: 0, padding: 0, fontWeight: 600, textDecoration: "underline" }}>
                    Terms apply
                  </button>
                </div>
                <button className="claim" type="button" onClick={() => setClaimed(true)} disabled={claimed}>
                  {claimed ? "Claimed" : "Claim"}
                </button>
              </div>
              <div className="card" id="booking">
                {nights ? (
                  <>
                    <p className="price">
                      {claimed && <s>{inr(total)}</s>}
                      {inr(due)}
                    </p>
                    <p className="price-sub">for {nights} nights</p>
                  </>
                ) : (
                  <p className="price">Add dates for prices</p>
                )}
                <div className={guestsOpen ? "datebox open" : "datebox"}>
                  <div className="date-row">
                    <button className="date-field" type="button" onClick={() => document.getElementById("stay-calendar")?.scrollIntoView({ block: "start", behavior: "instant" })}>
                      <small>CHECK-IN</small>
                      {checkIn ? formatSlash(checkIn) : "Add date"}
                    </button>
                    <button className="date-field" type="button" onClick={() => document.getElementById("stay-calendar")?.scrollIntoView({ block: "start", behavior: "instant" })}>
                      <small>CHECKOUT</small>
                      {checkOut ? formatSlash(checkOut) : "Add date"}
                    </button>
                  </div>
                  <div className="guest-anchor">
                    <button className="guest-field" type="button" aria-expanded={guestsOpen} onClick={() => setGuestsOpen((open) => !open)}>
                      <span>
                        <small>GUESTS</small>
                        {guests}
                      </span>
                      <IconChevron dir={guestsOpen ? "up" : "down"} />
                    </button>
                    {guestsOpen && (
                      <div className="guest-pop">
                        {[
                          ["adults", "Adults", "Age 13+", adults],
                          ["children", "Children", "Ages 2–12", children],
                          ["infants", "Infants", "Under 2", infants],
                          ["pets", "Pets", "Bringing a service animal?", pets],
                        ].map(([key, label, hint, value]) => (
                          <div className="stepper" key={key}>
                            <div>
                              <b>{label}</b>
                              <span>{hint}</span>
                            </div>
                            <div className="stepper-controls">
                              <button type="button" aria-label={`Decrease ${label}`} onClick={() => changeGuests(key, -1)} disabled={value === 0 || (key === "adults" && value === 1)}>
                                –
                              </button>
                              <span>{value}</span>
                              <button
                                type="button"
                                aria-label={`Increase ${label}`}
                                onClick={() => changeGuests(key, 1)}
                                disabled={
                                  ((key === "adults" || key === "children") && adults + children >= MAX_GUESTS) ||
                                  (key === "infants" && value >= 5) ||
                                  (key === "pets" && value >= 2)
                                }
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                        <p style={{ color: "#717171", fontSize: 12 }}>This place has a maximum of 3 guests, not including infants.</p>
                        <button className="more" type="button" onClick={() => setGuestsOpen(false)}>
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {cancelDay && <p className="cancel-note">Free cancellation before {formatLong(cancelDay)}</p>}
                <button className="reserve" type="button" disabled={!nights} onClick={() => setReserveOpen(true)}>
                  Reserve
                </button>
                <p className="charge">You won't be charged yet</p>
              </div>
              <button className="report" type="button" onClick={() => setReportOpen(true)}>
                Report this listing
              </button>
            </aside>
          </div>

          <hr className="rule" />
          <section id="reviews" className="reviews">
            <h2 className="big-rating">
              <IconStar /> 4.95
            </h2>
            <p className="guest-fav-line">Guest favourite</p>
            <p style={{ marginTop: 0 }}>This home is a guest favourite based on ratings, reviews and reliability</p>
            <button className="how" type="button" onClick={() => setHowOpen((open) => !open)}>
              How reviews work
            </button>
            {howOpen && (
              <p>
                Reviews are written by guests after a stay. A guest favourite reflects ratings, reviews, and reliability over time.
              </p>
            )}
            <div className="review-top">
              <div>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>Overall rating</p>
                <div className="bars">
                  {histogram.map((value, index) => (
                    <div className="bar-row" key={5 - index}>
                      <span>{5 - index}</span>
                      <div className="track">
                        <div className="fill" style={{ width: `${value * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="score-list">
                {scores.map(([label, value]) => (
                  <div className="score-row" key={label}>
                    <span>{label}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="track">
                        <span className="fill" style={{ width: `${(value / 5) * 100}%`, display: "block" }} />
                      </span>
                      {value.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="chips">
              {chips.map(([label, count, file]) => (
                <button key={label} className="chip" type="button" aria-pressed={chip === label} onClick={() => setChip(chip === label ? null : label)}>
                  <img src={asset(file)} alt="" />
                  {label} {count}
                </button>
              ))}
            </div>
            {filteredReviews.length === 0 && <p>No reviews mention {chip}.</p>}
            <div className="review-grid">
              {filteredReviews.slice(0, 6).map((review) => {
                const long = review.text.length > 180;
                const open = expanded[review.name];
                return (
                  <article className="review" key={review.name}>
                    <div className="reviewer">
                      {review.avatar ? <img className="avatar" src={asset(review.avatar)} alt="" /> : <span className="initial">{review.initial}</span>}
                      <div>
                        <strong>{review.name}</strong>
                        <span>
                          {review.tenure} · {review.when}
                        </span>
                      </div>
                    </div>
                    <p className={!open && long ? "clamp" : ""}>{review.text}</p>
                    {long && !open && (
                      <button className="more" type="button" onClick={() => setExpanded({ ...expanded, [review.name]: true })}>
                        Show more
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
            <button className="outline-btn" type="button" onClick={() => setReviewsOpen(true)}>
              Show all {reviews.length} reviews
            </button>
          </section>

          <hr className="rule" />
          <section id="location">
            <h2 className="section-h">Where you’ll be</h2>
            <p className="loc-title">Candolim, Goa, India</p>
            <div className="map-wrap" aria-label="Map of Candolim">
              <div className="map-canvas" style={{ transform: `scale(${zoom})` }}>
                <MapArt />
              </div>
              <div className="map-pin" aria-hidden="true">
                <Logo />
              </div>
              <button className="map-search" type="button" aria-label="Search" onClick={() => setAreaSearch((open) => !open)}>
                <svg viewBox="0 0 32 32" width="16" height="16" aria-hidden="true">
                  <circle cx="14" cy="14" r="7" fill="none" stroke="#222" strokeWidth="2" />
                  <path d="M19 19l6 6" stroke="#222" strokeWidth="2" />
                </svg>
              </button>
              {areaSearch && (
                <form
                  className="map-search-panel"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setAreaSearch(false);
                  }}
                >
                  <label htmlFor="area">Search this area</label>
                  <input id="area" placeholder="Candolim" />
                  <button className="outline-btn" type="submit">
                    Search
                  </button>
                </form>
              )}
              <div className="zoom-stack">
                <button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(2.4, value + 0.3))}>
                  +
                </button>
                <button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(1, value - 0.3))}>
                  –
                </button>
              </div>
            </div>
            <p className="loc-note" style={{ marginTop: 16 }}>
              Exact location will be provided after booking.
            </p>
            <h3 className="neighbour-h">Neighbourhood highlights</h3>
            <p className={hoodOpen ? "neighbour" : "neighbour clamp"}>{neighbourhood}</p>
            {!hoodOpen && (
              <button className="more" type="button" onClick={() => setHoodOpen(true)}>
                Show more <IconChevron dir="right" />
              </button>
            )}
          </section>

          <hr className="rule" />
          <section id="host">
            <h2 className="section-h">Meet your host</h2>
            <div className="host-card">
              <div>
                <div className="host-identity">
                  <img src={asset("avatars/host.jpeg")} alt="" />
                  <div>
                    <h3>Mirashya Homes</h3>
                    <div className="host-badge">Host</div>
                  </div>
                </div>
                <div className="host-stats">
                  <div>
                    <b>1,463</b>
                    <span>Reviews</span>
                  </div>
                  <div>
                    <b>4.68★</b>
                    <span>Rating</span>
                  </div>
                  <div>
                    <b>2</b>
                    <span>Years hosting</span>
                  </div>
                </div>
                <p className="bio">Born in the 80s</p>
                <p className="bio">Where I went to school: NICMAR GOA</p>
                <p className="cohost-label">Co-Hosts</p>
                <div className="cohosts">
                  {cohosts.map((person) => (
                    <div className="cohost" key={person.name}>
                      {person.avatar ? <img src={asset(person.avatar)} alt="" /> : <div className="initial">{person.initial}</div>}
                      {person.name}
                    </div>
                  ))}
                </div>
              </div>
              <div className="host-side">
                <p className="cohost-label" style={{ marginTop: 0 }}>
                  Host details
                </p>
                <p>Response rate: 100%</p>
                <p>Responds within an hour</p>
                <button className="outline-btn" type="button" onClick={() => { setSent(false); setMessageOpen(true); }}>
                  Message host
                </button>
                <p className="protect">To help protect your payment, always use Airbnb to send money and communicate with hosts.</p>
              </div>
            </div>
          </section>

          <hr className="rule" />
          <section>
            <h2 className="section-h">Things to know</h2>
            <div className="know">
              <div>
                <h3>Cancellation policy</h3>
                <p>
                  {cancelDay
                    ? `Free cancellation before ${formatLong(cancelDay)}. Cancel before check-in on ${formatLong(checkIn)} for a partial refund.`
                    : "Add dates to see the cancellation policy."}
                </p>
                <p>Review this host’s full policy for details.</p>
                <button className="linkish" type="button" onClick={() => setPolicy("cancel")}>
                  Learn more
                </button>
              </div>
              <div>
                <h3>House rules</h3>
                <ul>
                  <li>Check-in after 2:00 pm</li>
                  <li>Checkout before 11:00 am</li>
                  <li>3 guests maximum</li>
                </ul>
                <button className="linkish" type="button" onClick={() => setPolicy("rules")}>
                  Learn more
                </button>
              </div>
              <div>
                <h3>Safety & property</h3>
                <ul>
                  <li>Carbon monoxide alarm not reported</li>
                  <li>Smoke alarm not reported</li>
                  <li>Exterior security cameras on property</li>
                </ul>
                <button className="linkish" type="button" onClick={() => setPolicy("safety")}>
                  Learn more
                </button>
              </div>
            </div>
          </section>

          <hr className="rule" />
          <section>
            <div className="nearby-head">
              <h2 className="section-h" style={{ marginBottom: 0 }}>
                More stays nearby
              </h2>
              <div className="carousel-nav">
                <span className="page-label">
                  {page + 1} / 2
                </span>
                <button className="icon-circle" type="button" aria-label="Previous stays" disabled={page === 0} onClick={() => setPage(0)}>
                  <IconChevron dir="left" />
                </button>
                <button className="icon-circle" type="button" aria-label="Next stays" disabled={page === 1} onClick={() => setPage(1)}>
                  <IconChevron dir="right" />
                </button>
              </div>
            </div>
            <div className="carousel">
              <div className="carousel-track" style={{ transform: `translateX(calc(-${page * 100}% - ${page * 16}px))` }}>
                {nearby.map((stay) => (
                  <a className="stay" href="#photos" key={stay.title}>
                    <img src={asset(stay.image)} alt="" />
                    <strong>{stay.title}</strong>
                    <div className="stay-meta">
                      <span>{inr(stay.price)}</span>
                      <span>
                        <IconStar /> {stay.rating}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
          <div style={{ height: 48 }} />
        </div>
      </main>

      {tour && photo == null && (
        <PhotoTour
          saved={saved}
          onSave={() => setSaved((value) => !value)}
          onShare={() => setShareOpen(true)}
          onClose={() => go(null, null)}
          onOpenPhoto={(index) => {
            setDirection("next");
            go("PHOTO_TOUR_SCROLLABLE", index);
          }}
        />
      )}
      {photo != null && photo >= 0 && photo < 43 && (
        <Lightbox
          index={photo}
          direction={direction}
          onClose={() => go(null, null)}
          onBackToTour={() => go("PHOTO_TOUR_SCROLLABLE", null)}
          onChange={(index, dir) => {
            setDirection(dir);
            const url = new URL(window.location.href);
            url.searchParams.set("modal", "PHOTO_TOUR_SCROLLABLE");
            url.searchParams.set("modalItem", String(1000 + index));
            window.history.replaceState({}, "", url);
            setPhoto(index);
          }}
        />
      )}

      {amenitiesOpen && (
        <Dialog title="What this place offers" onClose={() => setAmenitiesOpen(false)}>
          {amenityGroups.map((group) => (
            <div className="amenity-group" key={group.title}>
              <h3>{group.title}</h3>
              {group.items.map((item) => (
                <div className="amenity" key={item}>
                  <AmenityIcon name={item} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </Dialog>
      )}

      {reviewsOpen && (
        <Dialog title={`4.95 · ${reviews.length} reviews`} onClose={() => setReviewsOpen(false)} wide>
          <div className="review-grid">
            {reviews.map((review) => (
              <article className="review" key={review.name}>
                <div className="reviewer">
                  {review.avatar ? <img className="avatar" src={asset(review.avatar)} alt="" /> : <span className="initial">{review.initial}</span>}
                  <div>
                    <strong>{review.name}</strong>
                    <span>
                      {review.tenure} · {review.when}
                    </span>
                  </div>
                </div>
                <p>{review.text}</p>
              </article>
            ))}
          </div>
        </Dialog>
      )}

      {sleepRoom && (
        <PhotoTour
          startRoom={sleepRoom}
          saved={saved}
          onSave={() => setSaved((value) => !value)}
          onShare={() => setShareOpen(true)}
          onClose={() => setSleepRoom(null)}
          onOpenPhoto={(index) => {
            setSleepRoom(null);
            setDirection("next");
            go("PHOTO_TOUR_SCROLLABLE", index);
          }}
        />
      )}

      {termsOpen && (
        <Dialog title="Terms apply" onClose={() => setTermsOpen(false)}>
          <p>Claim this offer to take 10% off the stay total. The discount is applied on this listing before you reserve.</p>
        </Dialog>
      )}

      {reserveOpen && (
        <Dialog title="Request to book" onClose={() => setReserveOpen(false)}>
          <p>
            {TITLE}
          </p>
          <p>
            {checkIn && formatShort(checkIn)} – {checkOut && formatShort(checkOut)} · {guests}
          </p>
          <p>
            <strong>{inr(due)}</strong> for {nights} nights
          </p>
          <p>You won't be charged yet.</p>
          <button className="reserve" type="button" onClick={() => setReserveOpen(false)}>
            Continue
          </button>
        </Dialog>
      )}

      {reportOpen && (
        <Dialog title="Report this listing" onClose={() => setReportOpen(false)}>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              setReportOpen(false);
            }}
          >
            <label htmlFor="reason">What is wrong with this listing?</label>
            <textarea id="reason" rows={4} required />
            <button className="reserve" type="submit">
              Submit
            </button>
          </form>
        </Dialog>
      )}

      {auth && (
        <Dialog title={auth} onClose={() => setAuth(null)}>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              setAuth(null);
            }}
          >
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required />
            <button className="reserve" type="submit">
              Continue
            </button>
          </form>
        </Dialog>
      )}

      {messageOpen && (
        <Dialog title="Message host" onClose={() => setMessageOpen(false)}>
          {sent ? (
            <p className="toast">Message sent to Mirashya Homes.</p>
          ) : (
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault();
                setSent(true);
              }}
            >
              <label htmlFor="note">Your message</label>
              <textarea id="note" rows={5} required placeholder="Hi Mirashya Homes, I'm interested in this stay." />
              <button className="reserve" type="submit">
                Send
              </button>
            </form>
          )}
        </Dialog>
      )}

      {policy && (
        <Dialog
          title={policy === "cancel" ? "Cancellation policy" : policy === "rules" ? "House rules" : "Safety & property"}
          onClose={() => setPolicy(null)}
        >
          {policy === "cancel" && (
            <>
              <p>
                Free cancellation before {cancelDay ? formatLong(cancelDay) : "the day before check-in"}. Cancel before check-in
                {checkIn ? ` on ${formatLong(checkIn)}` : ""} for a partial refund.
              </p>
              <p>Review this host’s full policy for details.</p>
            </>
          )}
          {policy === "rules" && (
            <ul>
              <li>Check-in after 2:00 pm</li>
              <li>Checkout before 11:00 am</li>
              <li>3 guests maximum</li>
            </ul>
          )}
          {policy === "safety" && (
            <ul>
              <li>Carbon monoxide alarm not reported</li>
              <li>Smoke alarm not reported</li>
              <li>Exterior security cameras on property</li>
            </ul>
          )}
        </Dialog>
      )}
    </>
  );
}
