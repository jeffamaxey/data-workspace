import React from 'react';

export default function QueryFailedMask({ errorMessage }) {
  return (
    <div id="data-loading-spinner">
      <div>
        <p className="govuk-heading-m">Failed to run your query</p>
        <p className="govuk-body">{errorMessage}</p>
      </div>
    </div>
  )
}
