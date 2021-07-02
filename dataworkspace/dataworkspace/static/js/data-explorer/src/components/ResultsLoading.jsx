import React from 'react';
import {Spin} from "antd";

export default function ResultsLoading() {
  return (
    <div className="no-query">
      <Spin tip="Running query" />
    </div>
  )
}
