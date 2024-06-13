import React from "react";
import GenericTable from "../../components/GenericTable"
import { useAuthContext } from "../../hooks/useAuthContext";
import { useCollection } from "../../hooks/useCollection";
import { Button } from '@material-ui/core';
import AssignmentIcon from '@material-ui/icons/Assignment';
import { useReducer, useEffect, useState } from 'react'
import OKDialog from "../../components/Dialogs/OKDialog";


export default function Vehicles() {
  const collection = "vehicles" // THIS IS WHERE THE TABLE NAME GOES
  const { user } = useAuthContext();
  const {documents, error} = useCollection(collection)

  let props = {
    collection:collection, 
    documents: documents,
    error: error,
    title:"Add Vehicle",

    keyColumn:[{
        key: "registration",
        name: "Registration"
    }],
      
    columns: [
      {
        name: "Registration",
        selector: (row) => row.registration,
        sortable: true
      },
      {
        name: "VIN",
        selector: (row) => row.vin,
        sortable: false
      },
      {
        name: "Make",
        selector: (row) => row.make || "-",
        sortable: true
      },
      {
        name: "Model",
        selector: (row) => row.model || "-",
        sortable: true
      },
      {
        name: "Capacity",
        selector: (row) => row.capacity || "-",
        sortable: true
      },

      // {
      //   name: "More Info",
      //   cell: (row) => (
      //       <Button
      //           variant="contained"
      //           size="small"
      //           color="primary"
      //           onClick={() => console.log("")}
      //           aria-label="add"
      //           startIcon={ <AssignmentIcon style={{marginLeft: "25%"}}/> }
      //           >
      //       </Button>
      //   ),
      //   sortable: false,
      // },
      // {
      //   name: "Time/Date Recorded",
      //   selector: (row) => row.recordedAt,
      //   sortable: true
      // },
      
    ],
  }
    return (
      
    <div>
      {documents && (
        <GenericTable {...props} />
      )}
    </div>
    )
}

