import React from "react";

/**
 * Container component with a notched corner design.
 * Used for framing content sections.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to be wrapped
 * @param {Object} [props.style] - Inline styles
 */
const Pad = ({ children, style = {} }) => {
  return (
    <div className="pad" style={style}>
      <div className="pad__body">{children}</div>
      <style jsx>{`
        .pad {
          background-color: var(--colors-bg--300);
          border: 2px solid var(--colors-primary--600);
          clip-path: var(--ui-notch-path);
          position: relative;
        }

        .pad__body {
          padding: 1rem;
          padding-bottom: var(--ui-notch-amount);
        }

        .pad::before {
          background-color: var(--colors-primary--600);
          bottom: 5px;
          content: "";
          display: block;
          height: 3px;
          position: absolute;
          right: -6px;
          top: auto;
          transform: rotate(-45deg);
          width: var(--ui-notch-hypotenuse);
          z-index: 100;
        }
      `}</style>
    </div>
  );
};

export default Pad;
