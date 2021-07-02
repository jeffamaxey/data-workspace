import React, {useEffect, useState} from "react";

export default function HeightAdjustablePanel({ initialHeight, minHeight, maxHeight, offsetElementId, children }) {
  const [isResizing, setIsResizing] = useState(false);
  const [height, setHeight] = useState(initialHeight);

  const onMouseDown = e => {
    e.preventDefault();
    setIsResizing(true);
  };

  const onMouseUp = e => {
    setIsResizing(false);
  };

  const onMouseMove = e => {
    if (isResizing) {
      let offset = e.clientY - document.getElementById(offsetElementId).offsetTop;
      if (offset > minHeight && offset < maxHeight) {
        setHeight(offset);
      }
    }
  };

  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  });

  return (
    <div>
      <div className="site-background" style={{ height: height }}>
        {children}
      </div>
      <div
          style={{
            position: "relative",
            width: "100%",
            height: 4,
            zIndex: 100,
            cursor: "ns-resize",
            backgroundColor: "#eff2f5"
          }}
          onMouseDown={onMouseDown}
        />
    </div>
  )
}
