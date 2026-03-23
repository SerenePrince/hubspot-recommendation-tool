import React, { useState, useEffect } from "react";

export default function UrlReport({ urlAnalysisData }) {
  const returnProducts = (hsproducts) => {
    // console.log(hsproducts);

    return (
      <ul>
        {hsproducts.map((product, index) => (
          <li>{product.hubspotProduct}</li>
        ))}
      </ul>
    );
  };

  const generateReport = () => {
    const urlFinal = urlAnalysisData.finalUrl;

    const techData = urlAnalysisData.technologies;

    console.log(urlAnalysisData.finalUrl);

    // Anchor tag currently does not load HREF -- To Fix
    return (
      <div id="report-block">
        <div id="report-heading">
          <h3>Tech-stack analysis for:</h3>
          <h3>
            <a href={urlAnalysisData.finalUrl}>{urlAnalysisData.url}</a>
          </h3>
        </div>
        <table>
          <thead>
            <th>Found Technology</th>
            <th>Description</th>
            <th>Recommendation</th>
          </thead>
          <tbody>
            {techData.map((foundTech, index) => (
              <tr>
                <td>{foundTech.name}</td>
                <td>
                  <ul>
                    <li>Category: {foundTech.categories.name}</li>
                    <li>{foundTech.description}</li>
                  </ul>
                </td>
                <td>{returnProducts(foundTech.hubspot.products)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (urlAnalysisData === null || typeof urlAnalysisData !== "object") {
    return <div></div>;
  }

  return generateReport();
}
