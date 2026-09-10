import React from 'react'
import CoverflowCarousel from '../CoverflowCarousel/CoverflowCarousel'

export default function ConceptsSection(): React.ReactElement {
  return (
    <>
      <div className="container concepts-header">
        <p className="section-eyebrow">Concepts</p>
        <h2 className="concepts-title">
          Independent builds.<br />Real ideas.
        </h2>
      </div>
      <CoverflowCarousel />
    </>
  )
}
