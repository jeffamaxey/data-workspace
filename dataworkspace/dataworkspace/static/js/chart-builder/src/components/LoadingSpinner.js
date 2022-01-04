import React from 'react';

export default function LoadingSpinner({ message }) {
  return (
    <div id="data-loading-spinner">
      <div>
        <div className="govuk-!-margin-bottom-4 loading-spinner" />
        <p className="govuk-heading-m">{message}</p>
      </div>
    </div>
  )
}
