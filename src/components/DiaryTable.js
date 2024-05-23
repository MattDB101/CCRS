import React from "react";
import ReactDOM from "react-dom";
import DataTable from "react-data-table-component";
import Card from "@material-ui/core/Card";
import SortIcon from "@material-ui/icons/ArrowDownward";
import { Typography } from "@material-ui/core";
import { Box, Button, Tooltip, TextField } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import { makeStyles } from "@material-ui/core/styles";
import { pink, yellow } from "@material-ui/core/colors";
import Paper from "@material-ui/core/Paper";
import { useState, useEffect, useContext } from "react";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import FilterListIcon from "@material-ui/icons/FilterList";
import { useAuthContext } from '../hooks/useAuthContext';
import { useFirestore } from "../hooks/useFirestore";
import AddJobDialog from "./Dialogs/AddJobDialog";
import { Add } from "@mui/icons-material";



const useStyles = makeStyles((theme) => ({

    style: {
      background: "#fafafa",
      fontSize: "1rem",
      width: "100%",
      height: "100%",
      fontFamily: "Roboto, sans-serif",
      fontWeight: 400,
      lineHeight: 1.42857,
      textRendering: "optimizeLegibility",
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
    },

    root: {
        width: "100%",
        marginBottom: theme.spacing(2),
    },
    paper: {
        marginBottom: theme.spacing(2),
    },
    table: {
        minWidth: 750,
    },
    visuallyHidden: {
        border: 0,
        clip: "rect(0 0 0 0)",
        height: 1,
        margin: -1,
        overflow: "hidden",
        padding: 0,
        position: "absolute",
        top: 20,
        width: 1,
    },
    tableHeader: {
        display: "flex",
        alignItems: "center",
        columnGap: "1rem",
        paddingTop: "1rem",
        overflow: "visible",
        marginBottom: "0.3rem",
    },
    selectedCount: {
        flex: "2 2 90%",
    },
    title: {
        flex: "1 1",
        whiteSpace: "nowrap",
    },
    editButton: {
        backgroundColor: yellow[800],
        borderColor: yellow[800],
        color: "white",
        "&:hover": {
            backgroundColor: yellow[900],
        },
    },
    filterButton: {

        backgroundColor: pink[600],
        borderColor: pink[600],
        color: "white",
        "&:hover": {
            backgroundColor: pink[700],
        },
    },
    searchBar: {
        flex: "1 1 30%",
    },
  }));

function sortByRecent( a, b ) {
    if ( a.createdAt.seconds < b.createdAt.seconds){
        return 1;
    }

    if ( a.createdAt.seconds > b.createdAt.seconds){
        return -1;
    }

    return 0;
}

function toDateTime(secs) {
    var t = new Date(1970, 0, 1); // Epoch
    var localOffset = t.getTimezoneOffset() * 1000; // Get local timezone offset in milliseconds
    secs += localOffset / 1000; // Add the offset to convert to UTC

    t.setSeconds(secs);

    var options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    var DateString = t.toLocaleDateString("en-GB", options); // Format date as dd/mm/yyyy
    var TimeString = t.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' }); // Format time as HH:MM

    var timeDateString = DateString + " " + TimeString;
    return timeDateString;
}


export default function DiaryTable(props) {

    const classes = useStyles();
    const [controlsDisabled, setControlsDisabled] = useState(false)
    const [selected, setSelected] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [toggleCleared, setToggleCleared] = React.useState(false);
    const [columnFilters, setColumnFilters] = useState({});
    const { user } = useAuthContext(); 
    const {addDocument, deleteDocument, updateDocument, response} = useFirestore(props.collection)
    const docToAdd = props.docToAdd

    const filterTerm = (event) => setSearchTerm(event.target.value);

    const [AddDialogState, setDialogState] = useState({shown: false, edit: false, selected:"", title: "", message: "", flavour: "success"})

        
    const handleDelete = () => {
        if (selected.length == 1) {
            if (window.confirm("Are you sure you want to delete this row?")) {
                setToggleCleared(!toggleCleared);
                deleteDocument(selected[0].id)
                selected.length = 0;
            }
        } else {
            var confirm = prompt("Please enter \"CONFIRM\" to delete these rows. \nWARNING: This cannot be undone!",);
            if (confirm && confirm.toLowerCase === "confirm") {
                setToggleCleared(!toggleCleared);
                for (let i = 0; i < selected.length; i++) {
                    deleteDocument(selected[i].id)
                }
            selected.length = 0;
            }   
        }
    }
    const handleAdd = () => {
        setDialogState({shown: true, edit: false, selected:"", title:"Add Job To Diary", message: "jobs", flavour: "success"})
    }


    const handleEdit = () => {
        //updateDocument()

    };

    const handleFilter = () => {
        
    };

    const selectedItemText = () => {
        if (selected.length === 0) return "";
        if (selected.length === 1) return "1 row selected";
        if (selected.length > 1 && selected.length < props.documents.length)
            return `${selected.length} ${("rows selected")}`;
        if (selected.length === props.documents.length) return ("All rows selected");

        return "";
    };

    const rangeFilter = (greaterThan, value, lessThan) => {
        if (value >= greaterThan && value <= lessThan) return true;

        return false;
    };

    const filterRows = () => {

    props.documents.sort(sortByRecent)

    for (let i = 0; i < props.documents.length; i++) {
        props.documents[i].recordedAt=toDateTime(props.documents[i].createdAt.seconds)
    }
    

    let res = props.documents.filter((row) => {
        if (!`${row[props.keyColumn[0].key]}`.toLowerCase().includes(searchTerm.toLowerCase()))
            return false;

        let isValid = true;

        Object.keys(columnFilters).forEach((filterKey) => {
            let filter = columnFilters[filterKey];
            if (!filter.enabled) return;

            if (filter.type === "text") {

                if (!`${row[filterKey]}`.toLowerCase().includes(filter.filterValue.includes.toLowerCase())) {
                    isValid = false;
                }
                return;

            } else if (filter.type === "numeric") {
                if (
                    !rangeFilter(
                        filter.filterValue.greaterThan,
                        row[filterKey],
                        filter.filterValue.lessThan
                    )
                )
                    isValid = false;
                return;

            } else if (filter.type === "date") {
                if (
                    !rangeFilter(
                        filter.filterValue.from,
                        new Date(row[filterKey]),
                        filter.filterValue.to
                    )
                )
                    isValid = false;
                return;
            }
        });

        return isValid;
    });
    return res;
    };

    return (
        <div className={classes.style}>
        <Card>
        <Paper>
                    <Box mx={2} className={classes.tableHeader}>
                        <Typography
                            className={classes.title}
                            style={{ fontWeight: 400, fontSize: "1.25rem" }}
                        >
                            {props.title}
                        </Typography>

                        <Typography
                            className={classes.selectedCount}
                            style={{ color: "grey", fontSize: ".9rem" }}
                        >
                            {selectedItemText()}
                        </Typography>
                        <div className={classes.searchBar}>
                            <TextField
                                label={`${"Search by"} ${props.keyColumn[0].name}`}
                                id="outlined-size-small"
                                style={{minWidth:"160px"}}
                                value={searchTerm}
                                onChange={filterTerm}
                                variant="outlined"
                                fullWidth
                                size="small"
                                //dense
                            />
                        </div>


            <div style={{ display: 'flex', justifyContent: 'right', alignItems: 'right', flex: '30%' }}>

                <Tooltip title={"Add Record"}>
                    <Button
                        style={{marginLeft:"10px"}}
                        disabled={controlsDisabled}
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => { handleAdd()}}
                        aria-label="add"
                        startIcon={<AddIcon style={{ marginLeft: "30%" }} />}
                    >
                    </Button>
                </Tooltip>

                <Tooltip title="Delete Record(s)">
                <span disabled={selected.length === 0 || controlsDisabled}>
                    <Button
                        style={{marginLeft:"10px"}}
                        disabled={selected.length === 0 || controlsDisabled}
                        size="small"
                        onClick={() => { handleDelete()}}
                        aria-label="delete"
                        variant="contained"
                        color="secondary"
                        startIcon={<DeleteIcon style={{ marginLeft: "30%" }} />}
                    >
                    </Button>
                </span>
            </Tooltip>
           {/* 
            <Tooltip title="Filter Records">
                <Button
                    style={{marginLeft:"10px"}}
                    variant="contained"
                    size="small"
                    onClick={() => { handleFilter()}}
                    className={classes.filterButton}
                    aria-label="add"
                    startIcon={<FilterListIcon style={{ marginLeft: "30%" }} />}
                >
                </Button>
            </Tooltip> 
            */}
            
            {/* 
            <Tooltip title="Edit Record">
            <span>
                    <Button
                        disabled={selected.length === 0 || selected.length > 1 || controlsDisabled}
                        style={{marginLeft:"10px"}}
                        size="small"
                        className={classes.editButton}
                        onClick={() => { handleEdit()}}
                        startIcon={<EditIcon style={{ marginLeft: "30%" }} />}
                        aria-label="edit"
                        variant="contained"
                    >
                    </Button>
                </span>
            </Tooltip>
            */}

            </div>
            </Box>
            <DataTable
                columns={props.columns}
                onSelectedRowsChange={(e) => setSelected(e.selectedRows)}
                data={filterRows()}
                sortIcon={<SortIcon />}
                clearSelectedRows={toggleCleared}
                selectableRows
                striped
            />

           
            <AddJobDialog
                show={AddDialogState.shown}
                title={AddDialogState.title}
                edit={AddDialogState.edit}
                collection={props.collection}
                selected={AddDialogState.selected}
                message={AddDialogState.message}
                flavour={AddDialogState.flavour}
                callback={
                    (res) => {
                        let callback = AddDialogState.callback;
                        setDialogState({ shown: false });
                        if (callback) callback(res);
                    }
                }
            />

            <Typography
                className={classes.title}
                style={{ color: "Red", fontSize: "1.25rem", marginLeft: "20px"}}
            >
                {props.error}
            </Typography>

            </Paper>
        </Card>
        </div>
    );
}

