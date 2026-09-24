import metro from '@/data/photography/andheri-west.json';
import chamber from '@/data/photography/lok-sabha.json';
import sports from '@/data/photography/andheri-sports.json';

const photographs = {
  place: { manifest: metro, width: 1355, height: 813, caption: 'Andheri West · New Link Road · 2023', alt: 'Andheri West metro station viewed from New Link Road, with its station sign, elevated tracks and street traffic.' },
  parliament: { manifest: chamber, width: 1600, height: 779, caption: 'Lok Sabha chamber · New Delhi · 2023', alt: 'Rows of desks and seats facing the Speaker’s chair inside the empty Lok Sabha chamber.' },
  money: { manifest: sports, width: 2560, height: 1287, caption: 'Andheri Sports Complex · 2012', alt: 'Andheri Sports Complex stadium, with tiered seating, a tall tower and surrounding apartment buildings.' },
};

/** Context photographs stay separate from civic evidence and from factual text. */
export function StoryImage({ moment }: { moment: keyof typeof photographs }) {
  const { manifest, width, height, caption, alt } = photographs[moment];
  return <figure className={`story-image story-image--${moment}`}>
    <div className="story-image-frame">
      {/* Original licensed bytes are also embedded in the portable review copy. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/story/${manifest.id}.jpg`} width={width} height={height} alt={alt} loading={moment === 'place' ? 'eager' : 'lazy'} fetchPriority={moment === 'place' ? 'high' : 'auto'} decoding="async"/>
    </div>
    <figcaption>
      <p>{caption}{moment === 'money' && <span className="photo-context">Context only. Not a documented MPLADS work.</span>}</p>
      <details className="photo-credit">
        <summary>photo credit <span aria-hidden="true">↗</span></summary>
        <div>
          <p>Photograph: {manifest.creator}. Taken {manifest.date}.</p>
          <p><a href={manifest.page}>Original photograph & attribution ↗</a></p>
          <p><a href={manifest.licenseUrl}>{manifest.license} ↗</a>. Displayed in grayscale with a responsive crop. Original file unchanged; these visual adaptations use the same license.</p>
          {moment === 'money' && <p>This 2012 photograph provides local civic context. It does not show the current condition, funding source or completion of any work in the MPLADS records.</p>}
        </div>
      </details>
    </figcaption>
  </figure>;
}
