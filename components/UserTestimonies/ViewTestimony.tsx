import { formUrl } from "components/publish/hooks"
import { NoResults } from "components/search/NoResults"
import { TestimonyContent } from "components/testimony"
import { ViewAttachment } from "components/ViewAttachment"
import React, {
  RefObject,
  useRef,
  useState,
  ReactEventHandler,
  useEffect
} from "react"
import { ListGroup, ListGroupItem } from "react-bootstrap"
import Image from "react-bootstrap/Image"
import styled from "styled-components"
import { useMediaQuery } from "usehooks-ts"
import { Button, Col, Form, OverlayTrigger, Row, Dropdown } from "../bootstrap"
import {
  Testimony,
  usePublicProfile,
  UsePublishedTestimonyListing
} from "../db"
import { formatBillId } from "../formatting"
import { Internal, maple } from "../links"
import { TitledSectionCard } from "../shared"
import { PositionLabel } from "./PositionBug"
import { PaginationButtons } from "components/table"
import { ReportModal } from "./ReportModal"
import { Tab, Tabs } from "./Tabs"
import { authorRole } from "../db"

import { Card as MapleCard } from "../Card"
import { Card as BootstrapCard } from "react-bootstrap"

const Container = styled.div`
  font-family: Nunito;
`
const Head = styled(BootstrapCard.Header)`
  background-color: var(--bs-blue);
  color: white;
  font-size: 22px;
`

const ViewTestimony = (
  props: UsePublishedTestimonyListing & {
    search?: boolean
    showControls?: boolean
    showBillNumber?: boolean
    className?: string
  }
) => {
  const {
    pagination,
    items,
    setFilter,
    showControls = false,
    showBillNumber = false
  } = props
  const [testimony, setTestimony] = useState<Testimony[]>([])
  useEffect(() => {
    setTestimony(items.result ?? [])
  }, [items])

  const [activeTab, setActiveTab] = useState(1)

  const handleTabClick = (e: Event, value: number) => {
    setActiveTab(value)
  }

  const handleFilter = (filter: authorRole | null) => {
    if (filter === "organization") {
      setFilter({ authorRole: "organization" })
    } else {
      const authorRole =
        filter === null
          ? null
          : [
              "user",
              "admin",
              "legislator",
              "pendingUpgrade",
              undefined
            ].includes(filter)
          ? filter
          : null
      setFilter(authorRole ? { authorRole } : null)
    }
  }

  const tabs = [
    <Tab
      key="at"
      label="All Testimonies"
      active={false}
      value={1}
      action={() => handleFilter(null)}
    />,
    <Tab
      key="uo"
      label="Individuals"
      active={false}
      value={2}
      action={() => handleFilter("user")}
    />,
    <Tab
      key="oo"
      label="Organizations"
      active={false}
      value={3}
      action={() => handleFilter("organization")}
    />
  ]
  return (
    <Container>
      <MapleCard
        headerElement={<Head>Testimony</Head>}
        body={
          <BootstrapCard.Body>
            <Tabs
              childTabs={tabs}
              onChange={handleTabClick}
              selectedTab={activeTab}
            ></Tabs>
            {/* <DropDownsContainerStyle>
        <UserFilterDropDown handleUsers={handleShownClick} users={shown} />
        <OrderFilterDropDownMenu
          handleOrder={handleOrderClick}
          currentOrder={orderBy}
        />
      </DropDownsContainerStyle> */}
            {testimony.length > 0 ? (
              testimony.map(t => (
                <TestimonyItem
                  key={t.authorUid + t.billId}
                  testimony={t}
                  showControls={showControls}
                  showBillNumber={showBillNumber}
                />
              ))
            ) : (
              <NoResults>
                There is no testimony here. <br />
                <b>Be the first and add one!</b>
              </NoResults>
            )}
            {/* <div className="p-3" /> */}
            <PaginationButtons pagination={pagination} />
          </BootstrapCard.Body>
        }
      />
    </Container>
  )
}

export const SortTestimonyDropDown = ({
  orderBy,
  setOrderBy
}: {
  orderBy?: string
  setOrderBy: (order: string) => void
}) => {
  return (
    <Form.Select
      className="bg-white w-100"
      onChange={e => setOrderBy(e.target.value)}
    >
      <option value="Most Recent First">Most Recent First</option>
      <option value="Oldest First">Oldest First</option>
    </Form.Select>
  )
}

const TestimonyItemContentStyle = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  button {
    align-self: flex-end;
  }
  hr {
    height: 3px;
    background-color: #aaa;
  }
`
const TestimonyItemHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: -15px;
  width: 100%;
  .authorAndVersion {
    display: flex;
    align-items: center;
  }
  .version {
    padding: 0px 5px;
    margin: 0px 10px;
    background-color: #1a3185;
    border-radius: 15px;
    color: #fff;
    font-family: nunito;
    font-size: 10px;
    text-align: center;
  }
`
const Author = styled<{ testimony: Testimony }>(({ testimony, ...props }) => {
  const profile = usePublicProfile(testimony.authorUid)

  const authorName = profile.loading
    ? ""
    : profile.result?.fullName ?? testimony.authorDisplayName ?? "Anonymous"
  const linkToProfile = !!profile.result
  return (
    <div {...props}>
      {linkToProfile ? (
        <Internal href={`/profile?id=${testimony.authorUid}`}>
          {authorName}
        </Internal>
      ) : (
        authorName
      )}
    </div>
  )
})`
  font-weight: bold;
  .testimony-title {
    width: 60%;
  }

  @media (min-width: 768px) {
    .testimony-title {
      width: 100%;
    }
  }
`

const MoreButton = ({ children }: { children: React.ReactChild }) => {
  const menuRef = useRef<HTMLDivElement>(null)
  return (
    <OverlayTrigger
      rootClose
      trigger="click"
      placement="bottom-end"
      overlay={
        <div
          ref={menuRef}
          style={{ position: "absolute", background: "white" }}
        >
          {children}
        </div>
      }
    >
      <button
        style={{ border: "none", background: "none" }}
        aria-label="more actions"
      >
        ...
      </button>
    </OverlayTrigger>
  )
}

export const TestimonyItem = ({
  testimony,
  showControls,
  showBillNumber
}: {
  testimony: Testimony
  showControls: boolean
  showBillNumber: boolean
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const published = testimony.publishedAt.toDate().toLocaleDateString()
  const billLink = maple.bill({
    id: testimony.billId,
    court: testimony.court
  })

  const [isReporting, setIsReporting] = useState(false)

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        margin: "5%"
      }}
    >
      <PositionLabel
        position={testimony.position}
        avatar={
          testimony.authorRole === "organization"
            ? "organization.svg"
            : "individualUser.svg"
        }
      />
      <TestimonyItemContentStyle>
        <TestimonyItemHeader>
          <>
            {/* NAME OF USER/ORGANIZATION */}
            <div className="authorAndVersion">
              <Author testimony={testimony} />
              {testimony.version > 1 && <p className="version">Edited</p>}
            </div>
            {isMobile && showControls && (
              <>
                <Internal href={formUrl(testimony.billId, testimony.court)}>
                  <Image
                    src="/edit-testimony.svg"
                    alt="Edit icon"
                    height={50}
                    width={50}
                  />
                </Internal>

                <Internal href={`/bill?id=${testimony.billId}`}>
                  <Image
                    src="/delete-testimony.svg"
                    alt="Delete testimony icon"
                    height={50}
                    width={50}
                  />
                </Internal>
              </>
            )}
          </>
          <div>
            {showBillNumber && (
              <>
                <Internal href={`/bill?id=${testimony.billId}`}>
                  {formatBillId(testimony.billId)}
                </Internal>
                {" · "}
              </>
            )}
            {/* DATE */}
            {`${published}`}
            {/* <Internal
              href={`/testimony?author=${testimony.authorUid}&billId=${testimony.billId}`}
            >
              Full Text
            </Internal> */}
          </div>
        </TestimonyItemHeader>
        <hr />
        {/*WRITTEN TESTIMONY*/}
        <FormattedTestimonyContent testimony={testimony.content} />
        <MoreButton>
          <ListGroup>
            <ListGroup.Item action onClick={() => setIsReporting(true)}>
              Report
            </ListGroup.Item>
          </ListGroup>
        </MoreButton>
        {showControls && (
          <div
            style={{
              fontFamily: "nunito",
              borderLeft: "1px solid rgb(200, 200, 200)",
              minWidth: "20%"
            }}
          >
            <Internal href={formUrl(testimony.billId, testimony.court)}>
              Edit
            </Internal>
            <Internal href={billLink}>Delete</Internal>
          </div>
        )}
        <ViewAttachment testimony={testimony} />
        {isReporting && (
          <ReportModal
            onClose={() => setIsReporting(false)}
            onReport={report => {
              // TODO: connect to API call to add a report from this user
              console.log({ report })
            }}
            reasons={[
              "Personal Information",
              "Offensive",
              "Violent",
              "Spam",
              "Phishing"
            ]}
          />
        )}
      </TestimonyItemContentStyle>
    </div>
  )
}

export const FormattedTestimonyContent = ({
  testimony
}: {
  testimony: string
}) => {
  const snippetChars = 500
  const [showAllTestimony, setShowAllTestimony] = useState(false)
  const snippet = showAllTestimony
    ? testimony
    : testimony.slice(0, snippetChars)
  const canExpand = snippet.length !== testimony.length

  return (
    <>
      <TestimonyContent className="col m2" testimony={snippet} />

      {canExpand && (
        <Col className="ms-auto d-flex justify-content-start justify-content-sm-end">
          <Button variant="link" onClick={() => setShowAllTestimony(true)}>
            Show More
          </Button>
        </Col>
      )}
    </>
  )
}

export const OrderFilterDropDownMenu = (props: {
  currentOrder: string
  handleOrder?: ReactEventHandler
}) => {
  const { handleOrder, currentOrder } = props

  return (
    <DropdownContainer className="doodads">
      <StyledDropdown
        variant="success"
        id="dropdown-basic"
        className="order-filter"
      >
        {currentOrder}
      </StyledDropdown>

      <Dropdown.Menu>
        <Dropdown.Item onClick={handleOrder}>Most Recent</Dropdown.Item>
        <Dropdown.Item onClick={handleOrder}>Oldest</Dropdown.Item>
      </Dropdown.Menu>
    </DropdownContainer>
  )
}
export default ViewTestimony

const DropdownContainer = styled(Dropdown)`
  display: flex;
  flex-direction: row-reverse;
  margin: 5px;
  background: none !important;
`
const StyledDropdown = styled(Dropdown.Toggle)`
  display: flex;
  flex-direction: space-between;
  align-items: center;
  padding: 5px;

  font-size: 1.5rem;
  font-family: Nunito;

  background-color: white;
  border: 1px solid lightgrey;

  &:active,
  &:focus,
  &:hover {
    background-color: white !important;
    border-color: black !important;
  }
  &:active,
  &:focus {
    box-shadow: 0px 0px 10px 4px orange !important;
  }
  :after {
    display: flex;
    align-items: center;
    margin-left: auto;
    vertical-align: none;
    content: "▼";
    border-top: none;
    border-right: none;
    border-bottom: none;
    border-left: none;
    font-size: 30px;
  }
  & .order-filter {
    color: red !important;
    background-color: red !important;
  }
`

const DropDownsContainerStyle = styled.div`
  display: flex;
`
