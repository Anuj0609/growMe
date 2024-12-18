import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { DataTable, DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import "primereact/resources/themes/lara-dark-indigo/theme.css";

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

interface ApiResponse {
  data: Artwork[];
  pagination: {
    total: number;
  };
}

interface SelectionFormProps {
  totalRecords: number;
  onSubmit: (count: number) => Promise<void>;
  onHide: () => void;
}

// Constants
const ROWS_PER_PAGE = 12;
const API_BASE_URL = "https://api.artic.edu/api/v1/artworks";

// Component for the selection form
const SelectionForm: React.FC<SelectionFormProps> = ({
  totalRecords,
  onSubmit,
  onHide,
}) => {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const value = Number(formData.get("selectionCount"));
    await onSubmit(value);
    onHide();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="number"
        max={totalRecords}
        min={1}
        name="selectionCount"
        placeholder="Enter number of rows to select"
        className="p-2 rounded"
      />
      <Button type="submit" label="Submit" />
    </form>
  );
};

// Main component
export default function ArtGallery() {
  // State
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]);
  const [page, setPage] = useState(1);

  // Refs
  const overlayPanelRef = useRef<OverlayPanel>(null);

  // Data fetching
  const fetchArtworks = async (pageNum: number): Promise<Artwork[]> => {
    try {
      const response = await axios.get<ApiResponse>(
        `${API_BASE_URL}?page=${pageNum}`
      );
      setTotalRecords(response.data.pagination.total);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching artworks:", error);
      return [];
    }
  };

  // Handlers
  const handlePageChange = (event: DataTablePageEvent) => {
    const newPage = event.page ? event.page + 1 : 1;
    setPage(newPage);
  };

  const handleBulkSelection = async (count: number) => {
    let selectedItems = [...artworks];

    if (count > artworks.length) {
      const nextPageArtworks = await fetchArtworks(page + 1);
      selectedItems = [...artworks, ...nextPageArtworks];
    }

    setSelectedArtworks(selectedItems.slice(0, count));
  };

  // Effects
  useEffect(() => {
    const loadArtworks = async () => {
      const data = await fetchArtworks(page);
      setArtworks(data);
    };

    loadArtworks();
  }, [page]);

  // Selection column with overlay
  const SelectionHeader = () => (
    <>
      <Button
        type="button"
        icon="pi pi-image"
        onClick={(e) => overlayPanelRef.current?.toggle(e)}
      />
      <OverlayPanel ref={overlayPanelRef}>
        <SelectionForm
          totalRecords={totalRecords}
          onSubmit={handleBulkSelection}
          onHide={() => overlayPanelRef.current?.hide()}
        />
      </OverlayPanel>
    </>
  );

  return (
    <div className="max-h-[600px] mb-4">
      <DataTable
        value={artworks}
        selectionMode="checkbox"
        selection={selectedArtworks}
        onSelectionChange={(e) => setSelectedArtworks(e.value)}
        dataKey="id"
        tableStyle={{ minWidth: "50rem" }}
        paginator
        lazy
        rows={ROWS_PER_PAGE}
        totalRecords={totalRecords}
        onPage={handlePageChange}
        first={(page - 1) * ROWS_PER_PAGE}
        pageLinkSize={5}
        alwaysShowPaginator
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      >
        <Column
          selectionMode="multiple"
          headerStyle={{ width: "3rem" }}
          header={SelectionHeader}
        />
        <Column field="title" header="Title" />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Date Start" />
        <Column field="date_end" header="Date End" />
      </DataTable>
    </div>
  );
}