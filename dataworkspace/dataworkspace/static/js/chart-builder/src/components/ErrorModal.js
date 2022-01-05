import React from 'react';

export default function ErrorModal({ title, message }) {
  return (
    <div id="data-loading-spinner">
      <div>
        <p className="govuk-heading-m">Failed to run your query</p>
        <p className="govuk-body">{message}</p>
      </div>
    </div>
  )
}
